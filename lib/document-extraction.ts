import mammoth from 'mammoth';
import { DocumentImportError } from '@/lib/document-import-errors';

export type SupportedDocumentType = 'docx' | 'pdf' | 'txt';
export type ExtractionConfidence = 'high' | 'medium' | 'low';

export interface ExtractionQuality {
  confidence: ExtractionConfidence;
  alphaRatio: number;
  wordCount: number;
  signal: 'clean_text' | 'sparse_text' | 'noisy_text';
}

const SUPPORTED_MIME_TYPES: Record<SupportedDocumentType, string[]> = {
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  pdf: ['application/pdf'],
  txt: ['text/plain'],
};

const PDF_EMPTY_ERROR =
  'PDF appears to be empty or contains only images. Please ensure the PDF has extractable text.';
const DEFAULT_PARSER_TIMEOUT_MS = 15000;

function getExtensionFromName(fileName: string): string | null {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension || null;
}

export function resolveDocumentType(file: File): SupportedDocumentType | null {
  const extension = getExtensionFromName(file.name);
  if (extension === 'docx' || extension === 'pdf' || extension === 'txt') {
    return extension;
  }

  for (const [type, mimeTypes] of Object.entries(SUPPORTED_MIME_TYPES) as Array<
    [SupportedDocumentType, string[]]
  >) {
    if (mimeTypes.includes(file.type)) {
      return type;
    }
  }

  return null;
}

async function getFileSignature(file: File, byteLength = 8): Promise<Uint8Array> {
  const header = await file.slice(0, byteLength).arrayBuffer();
  return new Uint8Array(header);
}

function isPdfSignature(signature: Uint8Array): boolean {
  return (
    signature.length >= 5 &&
    signature[0] === 0x25 &&
    signature[1] === 0x50 &&
    signature[2] === 0x44 &&
    signature[3] === 0x46 &&
    signature[4] === 0x2d
  );
}

function isZipSignature(signature: Uint8Array): boolean {
  if (signature.length < 4) return false;
  const b0 = signature[0];
  const b1 = signature[1];
  const b2 = signature[2];
  const b3 = signature[3];
  return (
    b0 === 0x50 &&
    b1 === 0x4b &&
    ((b2 === 0x03 && b3 === 0x04) || (b2 === 0x05 && b3 === 0x06) || (b2 === 0x07 && b3 === 0x08))
  );
}

export async function resolveDocumentTypeSecure(file: File): Promise<SupportedDocumentType | null> {
  const hintedType = resolveDocumentType(file);

  if (!file || file.size === 0) {
    return hintedType;
  }

  const signature = await getFileSignature(file);
  const hasPdfSignature = isPdfSignature(signature);
  const hasZipSignature = isZipSignature(signature);

  // Magic bytes get highest priority when present.
  if (hasPdfSignature) {
    return 'pdf';
  }

  if (hasZipSignature) {
    // DOCX files are ZIP containers; only accept as DOCX with a matching hint.
    if (hintedType === 'docx') {
      return 'docx';
    }
  }

  // Reject mismatched binary hints to avoid spoofed/mislabeled uploads.
  if (hintedType === 'pdf' && !hasPdfSignature) {
    return null;
  }
  if (hintedType === 'docx' && !hasZipSignature) {
    return null;
  }

  return hintedType;
}

async function parsePDFBuffer(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFParser = require('pdf2json');
  const pdfParser = new PDFParser(null, 1);

  const text = await new Promise<string>((resolve, reject) => {
    pdfParser.on('pdfParser_dataError', (errData: { parserError?: Error }) => {
      reject(new Error(`PDF parsing error: ${errData.parserError?.message || 'Unknown error'}`));
    });

    pdfParser.on('pdfParser_dataReady', () => {
      try {
        const parsed = pdfParser.getRawTextContent();
        resolve(parsed || '');
      } catch (error) {
        reject(error);
      }
    });

    pdfParser.parseBuffer(buffer);
  });

  const normalized = text.trim();
  if (!normalized) {
    throw new Error(PDF_EMPTY_ERROR);
  }

  return normalized;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, onTimeout: () => Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(onTimeout()), timeoutMs);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function callExternalOcrFallback(file: File): Promise<string | null> {
  const endpoint = process.env.OCR_FALLBACK_ENDPOINT;
  if (!endpoint) {
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('filename', file.name);

  const headers: HeadersInit = {};
  if (process.env.OCR_FALLBACK_TOKEN) {
    headers.Authorization = `Bearer ${process.env.OCR_FALLBACK_TOKEN}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new DocumentImportError('OCR_FAILED', 'OCR fallback failed. Please try again with a clearer PDF.', 502);
  }

  const data = (await response.json()) as { text?: string };
  const text = data?.text?.trim();
  return text || null;
}

function analyzeTextQuality(text: string): ExtractionQuality {
  const nonWhitespaceChars = (text.match(/\S/g) || []).length;
  const alphaChars = (text.match(/[A-Za-z]/g) || []).length;
  const alphaRatio = nonWhitespaceChars > 0 ? alphaChars / nonWhitespaceChars : 0;
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length;

  if (wordCount < 25) {
    return {
      confidence: 'medium',
      alphaRatio,
      wordCount,
      signal: 'sparse_text',
    };
  }

  if (alphaRatio < 0.45) {
    return {
      confidence: 'low',
      alphaRatio,
      wordCount,
      signal: 'noisy_text',
    };
  }

  if (alphaRatio < 0.6) {
    return {
      confidence: 'medium',
      alphaRatio,
      wordCount,
      signal: 'noisy_text',
    };
  }

  return {
    confidence: 'high',
    alphaRatio,
    wordCount,
    signal: 'clean_text',
  };
}

export async function extractDocumentText(
  file: File,
  options?: {
    forceType?: SupportedDocumentType;
    maxCharacters?: number;
    timeoutMs?: number;
    enableOcrFallback?: boolean;
  }
): Promise<{ text: string; type: SupportedDocumentType; quality: ExtractionQuality; ocrUsed: boolean }> {
  const type = options?.forceType || (await resolveDocumentTypeSecure(file));
  if (!type) {
    throw new DocumentImportError('UNSUPPORTED_FILE_TYPE', 'Unsupported file type.', 400);
  }

  let text = '';
  let ocrUsed = false;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_PARSER_TIMEOUT_MS;
  const ocrEnabled = Boolean(options?.enableOcrFallback && process.env.OCR_FALLBACK_ENDPOINT);

  if (type === 'txt') {
    text = await withTimeout(
      file.text(),
      timeoutMs,
      () => new DocumentImportError('PARSER_TIMEOUT', 'Document parsing timed out.', 408)
    );
  } else {
    const arrayBuffer = await withTimeout(
      file.arrayBuffer(),
      timeoutMs,
      () => new DocumentImportError('PARSER_TIMEOUT', 'Document parsing timed out.', 408)
    );
    const buffer = Buffer.from(arrayBuffer);

    if (type === 'docx') {
      const result = await withTimeout(
        mammoth.extractRawText({ buffer }),
        timeoutMs,
        () => new DocumentImportError('PARSER_TIMEOUT', 'Document parsing timed out.', 408)
      );
      text = result.value;
    } else {
      try {
        text = await withTimeout(
          parsePDFBuffer(buffer),
          timeoutMs,
          () => new DocumentImportError('PARSER_TIMEOUT', 'Document parsing timed out.', 408)
        );
      } catch (error) {
        if (
          ocrEnabled &&
          ((error instanceof Error && error.message.includes(PDF_EMPTY_ERROR)) || error instanceof DocumentImportError)
        ) {
          const ocrText = await withTimeout(
            callExternalOcrFallback(file),
            timeoutMs,
            () => new DocumentImportError('PARSER_TIMEOUT', 'Document parsing timed out.', 408)
          );
          if (!ocrText) {
            throw new DocumentImportError(
              'OCR_REQUIRED',
              'This PDF appears to be scanned. OCR fallback is required to extract text.',
              422
            );
          }
          text = ocrText;
          ocrUsed = true;
        } else if (error instanceof DocumentImportError) {
          throw error;
        } else {
          throw new DocumentImportError('PARSE_FAILED', 'Failed to parse PDF document.', 500);
        }
      }
    }
  }

  const normalized = text.trim();
  if (!normalized) {
    throw new DocumentImportError(
      type === 'pdf' ? 'PDF_IMAGE_ONLY' : 'EMPTY_DOCUMENT',
      type === 'pdf' ? PDF_EMPTY_ERROR : 'Document appears to be empty.',
      422
    );
  }

  const limitedText =
    options?.maxCharacters && options.maxCharacters > 0
      ? normalized.substring(0, options.maxCharacters)
      : normalized;

  let quality = analyzeTextQuality(limitedText);
  if (type === 'pdf' && quality.confidence === 'low' && ocrEnabled && !ocrUsed) {
    const ocrText = await callExternalOcrFallback(file);
    if (ocrText && ocrText.trim()) {
      const fallbackText = options?.maxCharacters && options.maxCharacters > 0
        ? ocrText.trim().substring(0, options.maxCharacters)
        : ocrText.trim();
      quality = analyzeTextQuality(fallbackText);
      return {
        text: fallbackText,
        type,
        quality,
        ocrUsed: true,
      };
    }
    throw new DocumentImportError(
      'OCR_REQUIRED',
      'This PDF appears to be scanned. OCR fallback is required to extract text.',
      422
    );
  }

  return {
    text: limitedText,
    type,
    quality,
    ocrUsed,
  };
}

export const DOCUMENT_IMPORT_ERRORS = {
  PDF_EMPTY_ERROR,
} as const;
