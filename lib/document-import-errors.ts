export type DocumentImportErrorCode =
  | 'NO_FILE_PROVIDED'
  | 'FILE_TOO_LARGE'
  | 'TEXT_TOO_SHORT'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'EMPTY_DOCUMENT'
  | 'PDF_IMAGE_ONLY'
  | 'PARSER_TIMEOUT'
  | 'PARSE_FAILED'
  | 'OCR_REQUIRED'
  | 'OCR_FAILED';

export class DocumentImportError extends Error {
  code: DocumentImportErrorCode;
  statusCode: number;

  constructor(code: DocumentImportErrorCode, message: string, statusCode = 400) {
    super(message);
    this.name = 'DocumentImportError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function isDocumentImportError(error: unknown): error is DocumentImportError {
  return error instanceof DocumentImportError;
}

