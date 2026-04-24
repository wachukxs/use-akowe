import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import mammoth from 'mammoth';
import { Citation } from '@/types';
import {
  extractDocumentText,
  resolveDocumentTypeSecure,
} from '@/lib/document-extraction';
import { getImportErrorResponse, getLocalizedImportMessage } from '@/lib/import-error-localization';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';
import { extractPDFImages } from '@/lib/pdf-image-extractor';

/**
 * POST /api/projects/import
 * Handles file upload and parsing
 * Returns extracted data for user review
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: getLocalizedImportMessage(request, 'NO_FILE_PROVIDED'), errorCode: 'NO_FILE_PROVIDED' },
        { status: 400 }
      );
    }

    const detectedType = await resolveDocumentTypeSecure(file);
    if (!detectedType) {
      return NextResponse.json(
        { error: getLocalizedImportMessage(request, 'UNSUPPORTED_FILE_TYPE'), errorCode: 'UNSUPPORTED_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Validate file size (10MB for free, 50MB for pro - we'll check plan later)
    const maxSize = 50 * 1024 * 1024; // 50MB default
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `${getLocalizedImportMessage(request, 'FILE_TOO_LARGE')} Maximum size is 50MB.`, errorCode: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // Parse document based on detected file type
    let extractedData: {
      title: string;
      sections: Array<{ title: string; content: string; order: number }>;
      citations: Citation[];
      detectedType: 'essay' | 'thesis' | 'journal' | 'research';
      detectedCitationStyle: string;
      detectedMethodology: string;
      wordCount: number;
      topic: string;
    };

    try {
      if (detectedType === 'docx') {
        extractedData = await parseDOCX(file);
      } else if (detectedType === 'pdf') {
        extractedData = await parsePDF(file);
      } else if (detectedType === 'txt') {
        extractedData = await parseTXT(file);
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type' },
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error('Error parsing document:', parseError);
      const localized = getImportErrorResponse(parseError, request);
      if (localized) {
        return localized;
      }
      return NextResponse.json({ error: 'Failed to parse document. Please ensure the file is not corrupted.', errorCode: 'PARSE_FAILED' }, { status: 500 });
    }

    return NextResponse.json({
      extracted: extractedData,
      preview: {
        sectionCount: extractedData.sections.length,
        citationCount: extractedData.citations.length,
        wordCount: extractedData.wordCount,
      },
    });
  } catch (error) {
    console.error('Error importing project:', error);
    return NextResponse.json(
      { error: 'Failed to process import' },
      { status: 500 }
    );
  }
}

/**
 * Parse DOCX file using mammoth's HTML conversion.
 * Images embedded in the document are uploaded to Cloudinary and replaced
 * with their public URLs so they survive in the Tiptap editor.
 */
async function parseDOCX(file: File): Promise<{
  title: string;
  sections: Array<{ title: string; content: string; order: number }>;
  citations: Citation[];
  detectedType: 'essay' | 'thesis' | 'journal' | 'research';
  detectedCitationStyle: string;
  detectedMethodology: string;
  wordCount: number;
  topic: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to HTML, uploading every embedded image to Cloudinary.
    // mammoth calls convertImage for each <img> and uses the returned src.
    const { value: html } = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const imageBuffer = Buffer.from(await image.read());
            const url = await uploadBufferToCloudinary(imageBuffer, image.contentType);
            return { src: url };
          } catch {
            // If an individual image upload fails, omit it rather than
            // failing the whole import.
            return { src: '' };
          }
        }),
      }
    );

    const sections = parseHtmlIntoSections(html);

    // Plain text for metadata detection (strip tags)
    const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const title = file.name.replace(/\.(docx|pdf|txt)$/i, '');
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const topic = plainText.substring(0, 100).trim();
    const detectedCitationStyle = detectCitationStyle(plainText);
    const detectedType = detectProjectType(plainText, wordCount);
    const detectedMethodology = detectMethodology(plainText);

    return {
      title,
      sections: sections.length > 0 ? sections : [{ title: 'Content', content: html, order: 1 }],
      citations: [],
      detectedType,
      detectedCitationStyle,
      detectedMethodology,
      wordCount,
      topic,
    };
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    throw new Error('Failed to parse DOCX file. Please ensure the file is not corrupted.');
  }
}

/**
 * Parse PDF file.
 *
 * Text is extracted via pdf2json (fast, existing pipeline).
 * Images are extracted via pdfjs-dist + node-canvas, uploaded to Cloudinary,
 * and injected as <img> tags into the appropriate section content so they
 * appear in the Tiptap editor alongside the surrounding text.
 */
async function parsePDF(file: File): Promise<{
  title: string;
  sections: Array<{ title: string; content: string; order: number }>;
  citations: Citation[];
  detectedType: 'essay' | 'thesis' | 'journal' | 'research';
  detectedCitationStyle: string;
  detectedMethodology: string;
  wordCount: number;
  topic: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run text extraction and image extraction in parallel
    const [{ text: rawText }, pageImages] = await Promise.all([
      extractDocumentText(file, {
        forceType: 'pdf',
        timeoutMs: 15000,
        enableOcrFallback: true,
      }),
      extractPDFImages(buffer).catch((err) => {
        // Image extraction is best-effort; never block the import
        console.warn('[parsePDF] image extraction failed:', err);
        return new Map<number, string[]>();
      }),
    ]);

    // pdf2json inserts page-break markers like:
    //   "----------------Page (0) Break----------------"
    // where the number is 0-indexed. Split on these to get per-page text,
    // then re-inject any images found on that page before reassembling.
    const PAGE_MARKER = /[-]{4,}Page\s*\((\d+)\)\s*Break[-]{4,}/gi;
    const pageTexts = rawText.split(PAGE_MARKER).filter((_, i) => i % 2 === 0); // skip captured group indices

    let enrichedText = '';
    for (let i = 0; i < pageTexts.length; i++) {
      const pageText = pageTexts[i].trim();
      if (pageText) enrichedText += pageText + '\n';

      // 1-based page number; pdf2json marker says "Page (0)" for page 1
      const pdfPageNum = i + 1;
      const images = pageImages.get(pdfPageNum);
      if (images && images.length > 0) {
        for (const url of images) {
          enrichedText += `<img src="${url}" alt="Figure from page ${pdfPageNum}" style="max-width:100%;margin:1rem 0;display:block;" />\n`;
        }
      }
    }

    const sections = parseTextIntoSections(enrichedText);

    const title = file.name.replace(/\.(docx|pdf|txt)$/i, '');
    const plainText = rawText.replace(PAGE_MARKER, ' ');
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    const firstParagraph = plainText.split('\n\n')[0] || plainText.substring(0, 200);
    const topic = firstParagraph.substring(0, 100).trim();
    const detectedCitationStyle = detectCitationStyle(plainText);
    const detectedType = detectProjectType(plainText, wordCount);
    const detectedMethodology = detectMethodology(plainText);

    return {
      title,
      sections: sections.length > 0 ? sections : [{
        title: 'Content',
        content: enrichedText,
        order: 1,
      }],
      citations: [],
      detectedType,
      detectedCitationStyle,
      detectedMethodology,
      wordCount,
      topic,
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

/**
 * Parse TXT file
 */
async function parseTXT(file: File): Promise<{
  title: string;
  sections: Array<{ title: string; content: string; order: number }>;
  citations: Citation[];
  detectedType: 'essay' | 'thesis' | 'journal' | 'research';
  detectedCitationStyle: string;
  detectedMethodology: string;
  wordCount: number;
  topic: string;
}> {
  const { text } = await extractDocumentText(file, { forceType: 'txt', timeoutMs: 15000 });
  
  // Parse structure from text
  const sections = parseTextIntoSections(text);
  
  // Extract title from filename
  const title = file.name.replace(/\.(docx|pdf|txt)$/i, '');
  
  // Calculate word count
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  
  // Extract topic from first paragraph
  const firstParagraph = text.split('\n\n')[0] || text.substring(0, 200);
  const topic = firstParagraph.substring(0, 100).trim();
  
    // Detect citation style
    const detectedCitationStyle = detectCitationStyle(text);
    
    // Detect project type
    const detectedType = detectProjectType(text, wordCount);
    
    // Detect methodology
    const detectedMethodology = detectMethodology(text);
    
    return {
      title,
      sections: sections.length > 0 ? sections : [{
        title: 'Content',
        content: text,
        order: 1,
      }],
      citations: [], // TODO: Extract citations from text
      detectedType,
      detectedCitationStyle,
      detectedMethodology,
      wordCount,
      topic,
    };
}

/**
 * Parse mammoth-generated HTML into editor-ready sections by splitting on
 * heading tags (h1, h2, h3).  Content between headings (including any
 * <img> tags pointing at Cloudinary) is kept as raw HTML so the Tiptap
 * editor can render it faithfully.
 */
function parseHtmlIntoSections(
  html: string
): Array<{ title: string; content: string; order: number }> {
  // Split the HTML at every top-level heading tag.
  // The regex captures the full opening tag so we can extract the text from it.
  const parts = html.split(/(?=<h[1-3][\s>])/i);

  const sections: Array<{ title: string; content: string; order: number }> = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const headingMatch = trimmed.match(/^<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    if (headingMatch) {
      // The heading text (strip any inline tags inside the heading)
      const headingText = headingMatch[1].replace(/<[^>]+>/g, '').trim();
      // Everything after the closing heading tag is the section body
      const body = trimmed.slice(headingMatch[0].length).trim();
      sections.push({
        title: headingText || 'Section',
        content: body,
        order: sections.length + 1,
      });
    } else {
      // Content before the first heading
      if (sections.length === 0) {
        sections.push({ title: 'Content', content: trimmed, order: 1 });
      } else {
        // Append orphaned content to the last section
        sections[sections.length - 1].content += trimmed;
      }
    }
  }

  // Deduplicate consecutive sections with identical titles (same logic as the
  // text-based parser).
  const deduped: typeof sections = [];
  for (const section of sections) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.title.toLowerCase() === section.title.toLowerCase()) {
      prev.content = [prev.content, section.content].filter(Boolean).join('');
    } else {
      deduped.push({ ...section, order: deduped.length + 1 });
    }
  }

  return deduped;
}

/**
 * Helper function to parse text into sections.
 * Handles plain text from PDF (including Word-exported PDFs) and DOCX files.
 *
 * Key fixes for Microsoft Word PDFs:
 *  - Strips pdf2json page-break markers before parsing
 *  - Tightens heading detection (requires ≥2 words for ALL-CAPS lines to avoid
 *    matching single abbreviations or short body fragments)
 *  - Deduplicates consecutive sections that share the same title (Word PDFs
 *    sometimes repeat the running header at the top of each page)
 */
function parseTextIntoSections(text: string): Array<{ title: string; content: string; order: number }> {
  // Strip pdf2json page-break markers (e.g. "----------------Page (0) Break----------------")
  const cleaned = text.replace(/[-]{4,}Page\s*\(\d+\)\s*Break[-]{4,}/gi, '');

  const lines = cleaned.split('\n').filter(line => line.trim());
  const sections: Array<{ title: string; content: string; order: number }> = [];
  let currentSection: { title: string; content: string[] } | null = null;

  const KNOWN_SECTIONS = [
    'Introduction', 'Methodology', 'Methods', 'Results', 'Discussion',
    'Conclusion', 'Conclusions', 'Abstract', 'Literature Review',
    'Background', 'References', 'Bibliography', 'Appendix', 'Acknowledgements',
    'Acknowledgments', 'Related Work', 'Future Work',
  ];

  const isHeading = (line: string): boolean => {
    if (line.length === 0 || line.length >= 100) return false;
    // Numbered heading: "1. Introduction" or "1 Introduction"
    if (/^\d+\.?\s+[A-Z]/.test(line)) return true;
    // Known academic section keyword (case-insensitive full-word match)
    if (KNOWN_SECTIONS.some(h => new RegExp(`\\b${h}\\b`, 'i').test(line))) return true;
    // ALL-CAPS line: require at least 2 words to avoid matching abbreviations
    // and single-word fragments that appear in the body of Word PDFs
    if (/^[A-Z][A-Z\s]+$/.test(line)) {
      const wordCount = line.trim().split(/\s+/).filter(Boolean).length;
      return wordCount >= 2;
    }
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (isHeading(line)) {
      if (currentSection) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.join('\n\n'),
          order: sections.length + 1,
        });
      }
      currentSection = { title: line, content: [] };
    } else if (currentSection) {
      currentSection.content.push(line);
    } else {
      currentSection = { title: 'Content', content: [line] };
    }
  }

  if (currentSection) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.join('\n\n'),
      order: sections.length + 1,
    });
  }

  // Deduplicate consecutive sections with the same title (Word running headers
  // can cause the same heading to open a new section on every page).
  const deduped: typeof sections = [];
  for (const section of sections) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.title.toLowerCase() === section.title.toLowerCase()) {
      // Merge content into the existing section
      prev.content = [prev.content, section.content].filter(Boolean).join('\n\n');
    } else {
      deduped.push({ ...section, order: deduped.length + 1 });
    }
  }

  return deduped;
}

/**
 * Helper function to detect citation style from text
 */
function detectCitationStyle(text: string): string {
  // Detect citation style (simple heuristic)
  if (text.match(/\([A-Z][a-z]+(?:,? et al\.?)?, \d{4}\)/)) {
    return 'APA';
  } else if (text.match(/\[\d+\]/) || text.includes('[1]')) {
    return 'IEEE';
  } else if (text.match(/\([A-Z][a-z]+ \d{4}\)/)) {
    return 'Harvard';
  } else if (text.includes('(Author, Year)')) {
    return 'APA';
  }
  return 'APA'; // Default
}

/**
 * Helper function to detect project type from text
 */
function detectProjectType(text: string, wordCount: number): 'essay' | 'thesis' | 'journal' | 'research' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('abstract') || lowerText.includes('journal')) {
    return 'journal';
  } else if (lowerText.includes('thesis') || lowerText.includes('dissertation')) {
    return 'thesis';
  } else if (wordCount < 5000) {
    return 'essay';
  }
  return 'research'; // Default
}

/**
 * Helper function to detect methodology from text
 */
function detectMethodology(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Look for methodology section or keywords
  const methodologySection = lowerText.match(/methodology[:\s]+([^\.]+)/i);
  if (methodologySection) {
    const methodText = methodologySection[1].substring(0, 200).toLowerCase();
    
    // Check for specific methodology types
    if (methodText.includes('qualitative') || methodText.includes('interview') || methodText.includes('observation') || methodText.includes('case study') || methodText.includes('ethnography')) {
      return 'qualitative';
    }
    if (methodText.includes('quantitative') || methodText.includes('statistical') || methodText.includes('survey') || methodText.includes('experiment') || methodText.includes('analysis')) {
      return 'quantitative';
    }
    if (methodText.includes('mixed methods') || methodText.includes('triangulation') || methodText.includes('convergent')) {
      return 'mixed methods';
    }
    if (methodText.includes('literature review') || methodText.includes('systematic review') || methodText.includes('meta-analysis')) {
      return 'literature review';
    }
    if (methodText.includes('case study')) {
      return 'case study';
    }
  }
  
  // Fallback: check entire text for methodology keywords
  if (lowerText.includes('qualitative research') || lowerText.includes('qualitative study') || lowerText.includes('qualitative analysis')) {
    return 'qualitative';
  }
  if (lowerText.includes('quantitative research') || lowerText.includes('quantitative study') || lowerText.includes('statistical analysis')) {
    return 'quantitative';
  }
  if (lowerText.includes('mixed methods') || lowerText.includes('mixed-methods')) {
    return 'mixed methods';
  }
  if (lowerText.includes('systematic review') || lowerText.includes('literature review') || lowerText.includes('meta-analysis')) {
    return 'literature review';
  }
  if (lowerText.includes('case study') || lowerText.includes('case-study')) {
    return 'case study';
  }
  
  // Default to qualitative if no clear match
  return 'qualitative';
}
