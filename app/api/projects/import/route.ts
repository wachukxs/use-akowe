import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { Citation } from '@/types';
import {
  extractDocumentText,
  resolveDocumentTypeSecure,
} from '@/lib/document-extraction';
import { getImportErrorResponse, getLocalizedImportMessage } from '@/lib/import-error-localization';

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
 * Parse DOCX file using mammoth
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
    const { text } = await extractDocumentText(file, { forceType: 'docx', timeoutMs: 15000 });
    
    // Parse structure from text (similar to TXT parsing)
    const sections = parseTextIntoSections(text);
    
    // Extract title from filename or first heading
    const title = file.name.replace(/\.(docx|pdf|txt)$/i, '');
    
    // Calculate word count
    const wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
    
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
      citations: [], // TODO: Extract citations from document
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
 * Parse PDF file using pdf-parse
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
    const { text: extractedText } = await extractDocumentText(file, {
      forceType: 'pdf',
      timeoutMs: 15000,
      enableOcrFallback: true,
    });
    
    // Parse structure from text
    const sections = parseTextIntoSections(extractedText);
    
    // Extract title from filename or first heading
    const title = file.name.replace(/\.(docx|pdf|txt)$/i, '');
    
    // Calculate word count
    const wordCount = extractedText.split(/\s+/).filter((word: string) => word.length > 0).length;
    
    // Extract topic from first paragraph
    const firstParagraph = extractedText.split('\n\n')[0] || extractedText.substring(0, 200);
    const topic = firstParagraph.substring(0, 100).trim();
    
    // Detect citation style
    const detectedCitationStyle = detectCitationStyle(extractedText);
    
    // Detect project type
    const detectedType = detectProjectType(extractedText, wordCount);
    
    // Detect methodology
    const detectedMethodology = detectMethodology(extractedText);
    
    return {
      title,
      sections: sections.length > 0 ? sections : [{
        title: 'Content',
        content: extractedText,
        order: 1,
      }],
      citations: [], // TODO: Extract citations from document
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
 * Helper function to parse text into sections
 */
function parseTextIntoSections(text: string): Array<{ title: string; content: string; order: number }> {
  const lines = text.split('\n').filter(line => line.trim());
  const sections: Array<{ title: string; content: string; order: number }> = [];
  let currentSection: { title: string; content: string[] } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect potential heading (short line, possibly all caps or numbered)
    const isHeading = line.length < 100 && 
      (line.match(/^[A-Z\s]+$/) || 
       line.match(/^\d+\.?\s+[A-Z]/) ||
       ['Introduction', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'Abstract', 'Literature Review'].some(h => line.includes(h)));
    
    if (isHeading && currentSection) {
      // Save previous section
      sections.push({
        title: currentSection.title,
        content: currentSection.content.join('\n\n'),
        order: sections.length + 1,
      });
      currentSection = { title: line, content: [] };
    } else if (isHeading && !currentSection) {
      currentSection = { title: line, content: [] };
    } else if (currentSection) {
      currentSection.content.push(line);
    } else {
      // Create a default section if we have content but no section yet
      currentSection = { title: 'Content', content: [line] };
    }
  }
  
  // Add last section
  if (currentSection) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.join('\n\n'),
      order: sections.length + 1,
    });
  }
  
  return sections;
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
