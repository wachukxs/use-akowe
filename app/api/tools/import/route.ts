import { NextRequest, NextResponse } from 'next/server';
import {
  extractDocumentText,
  ExtractionConfidence,
  resolveDocumentTypeSecure,
} from '@/lib/document-extraction';
import { getImportErrorResponse, getLocalizedImportMessage } from '@/lib/import-error-localization';

// Simplified import preview for lead magnet (no auth required)
// Returns limited preview to encourage signup

interface ReadinessGap {
  type: 'missing_section' | 'low_citations' | 'short_section' | 'no_methodology' | 'weak_structure' | 'weak_extraction';
  message: string;
  severity: 'high' | 'medium' | 'low';
}

async function parseFile(file: File): Promise<{
  title: string;
  sections: Array<{ title: string; preview: string; wordCount: number }>;
  wordCount: number;
  citationCount: number;
  readinessScore: number;
  gaps: ReadinessGap[];
  extractionConfidence: ExtractionConfidence;
  extractionSignal: 'clean_text' | 'sparse_text' | 'noisy_text';
  ocrUsed: boolean;
}> {
  const detectedType = await resolveDocumentTypeSecure(file);
  if (!detectedType) {
    throw new Error('Unsupported file type');
  }

  const { text, quality, ocrUsed } = await extractDocumentText(file, {
    forceType: detectedType,
    maxCharacters: 20000,
    timeoutMs: 15000,
    enableOcrFallback: true,
  });
  
  // Extract title (first line or first heading)
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const title = lines[0]?.trim().substring(0, 100) || file.name.replace(/\.[^/.]+$/, '');
  
  // Detect sections by common headings
  const sectionPatterns = [
    /^(abstract|introduction|background|literature review|methodology|methods|results|discussion|conclusion|references|bibliography)/i,
    /^(chapter|section)\s*\d+/i,
    /^\d+\.\s+[A-Z]/,
  ];
  
  const sections: Array<{ title: string; preview: string; wordCount: number }> = [];
  let currentSection = { title: 'Introduction', content: '' };
  
  for (const line of lines.slice(1)) {
    let isHeading = false;
    for (const pattern of sectionPatterns) {
      if (pattern.test(line.trim())) {
        if (currentSection.content.trim()) {
          const sectionWords = currentSection.content.trim().split(/\s+/).filter(w => w.length > 0).length;
          sections.push({
            title: currentSection.title,
            preview: currentSection.content.trim().substring(0, 100) + '...',
            wordCount: sectionWords,
          });
        }
        currentSection = { title: line.trim().substring(0, 50), content: '' };
        isHeading = true;
        break;
      }
    }
    if (!isHeading) {
      currentSection.content += ' ' + line;
    }
  }
  
  // Add last section
  if (currentSection.content.trim()) {
    const sectionWords = currentSection.content.trim().split(/\s+/).filter(w => w.length > 0).length;
    sections.push({
      title: currentSection.title,
      preview: currentSection.content.trim().substring(0, 100) + '...',
      wordCount: sectionWords,
    });
  }
  
  // If no sections detected, create a generic one
  if (sections.length === 0) {
    sections.push({
      title: 'Main Content',
      preview: text.substring(0, 100) + '...',
      wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
    });
  }
  
  // Count citations (basic patterns)
  const citationPatterns = [
    /\([A-Za-z]+(?:,?\s+et\s+al\.?)?,?\s*\d{4}\)/g, // (Author, 2020)
    /\[[A-Za-z]+(?:,?\s+et\s+al\.?)?,?\s*\d{4}\]/g, // [Author, 2020]
    /\[\d+\]/g, // [1], [2], etc.
  ];
  
  const uniqueCitations = new Set<string>();
  for (const pattern of citationPatterns) {
    for (const match of text.matchAll(pattern)) {
      const value = match[0];
      if (!value) continue;
      const start = match.index ?? -1;
      uniqueCitations.add(`${start}:${value.toLowerCase()}`);
    }
  }
  const citationCount = uniqueCitations.size;
  
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  // Analyze gaps and calculate readiness score
  const gaps: ReadinessGap[] = [];
  let score = 100;
  
  // Check for expected academic sections
  const sectionTitlesLower = sections.map(s => s.title.toLowerCase());
  const hasMethodology = sectionTitlesLower.some(t => t.includes('method') || t.includes('methodology'));
  const hasLitReview = sectionTitlesLower.some(t => t.includes('literature') || t.includes('review') || t.includes('background'));
  const hasConclusion = sectionTitlesLower.some(t => t.includes('conclusion') || t.includes('summary'));
  const hasReferences = sectionTitlesLower.some(t => t.includes('reference') || t.includes('bibliography'));
  
  if (!hasMethodology) {
    gaps.push({ type: 'no_methodology', message: 'No methodology section detected', severity: 'high' });
    score -= 20;
  }
  if (!hasLitReview) {
    gaps.push({ type: 'missing_section', message: 'No literature review found', severity: 'high' });
    score -= 15;
  }
  if (!hasConclusion) {
    gaps.push({ type: 'missing_section', message: 'Missing conclusion section', severity: 'medium' });
    score -= 10;
  }
  if (!hasReferences) {
    gaps.push({ type: 'missing_section', message: 'No references section detected', severity: 'medium' });
    score -= 10;
  }
  
  // Check citation density
  const citationsPerThousandWords = (citationCount / wordCount) * 1000;
  if (citationsPerThousandWords < 5 && wordCount > 500) {
    gaps.push({ type: 'low_citations', message: `Only ${citationCount} citations for ${wordCount.toLocaleString()} words`, severity: 'high' });
    score -= 15;
  } else if (citationsPerThousandWords < 10 && wordCount > 500) {
    gaps.push({ type: 'low_citations', message: 'Citation density below academic standards', severity: 'medium' });
    score -= 8;
  }
  
  // Check for short sections
  const shortSections = sections.filter(s => s.wordCount < 100 && !s.title.toLowerCase().includes('abstract'));
  if (shortSections.length > 0) {
    gaps.push({ type: 'short_section', message: `${shortSections.length} section(s) need more content`, severity: 'low' });
    score -= 5;
  }
  
  // Check structure
  if (sections.length < 3) {
    gaps.push({ type: 'weak_structure', message: 'Document lacks clear structure', severity: 'medium' });
    score -= 10;
  }

  if (quality.confidence === 'low') {
    gaps.push({
      type: 'weak_extraction',
      message: 'Document text extraction quality is low. This PDF may be scanned or image-heavy.',
      severity: 'high',
    });
    score -= 20;
  } else if (quality.confidence === 'medium' && detectedType === 'pdf') {
    gaps.push({
      type: 'weak_extraction',
      message: 'PDF extraction confidence is moderate. Review imported text for missing sections.',
      severity: 'medium',
    });
    score -= 10;
  }
  
  // Ensure score stays in bounds
  score = Math.max(0, Math.min(100, score));
  
  return {
    title,
    sections: sections.slice(0, 5), // Limit to 5 sections for preview
    wordCount,
    citationCount,
    readinessScore: score,
    gaps: gaps.slice(0, 4), // Limit to 4 gaps for preview
    extractionConfidence: quality.confidence,
    extractionSignal: quality.signal,
    ocrUsed,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: getLocalizedImportMessage(request, 'NO_FILE_PROVIDED'), errorCode: 'NO_FILE_PROVIDED' },
        { status: 400 }
      );
    }
    
    // Validate file
    const extension = await resolveDocumentTypeSecure(file);
    if (!extension) {
      return NextResponse.json(
        { error: getLocalizedImportMessage(request, 'UNSUPPORTED_FILE_TYPE'), errorCode: 'UNSUPPORTED_FILE_TYPE' },
        { status: 400 }
      );
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: `${getLocalizedImportMessage(request, 'FILE_TOO_LARGE')} Maximum 10MB for free preview.`, errorCode: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }
    
    const result = await parseFile(file);
    
    return NextResponse.json({
      title: result.title,
      sections: result.sections,
      sectionCount: result.sections.length,
      wordCount: result.wordCount,
      citationCount: result.citationCount,
      readinessScore: result.readinessScore,
      gaps: result.gaps,
      isLimited: true,
      metadata: {
        fileType: extension,
        fileName: file.name,
        extractionConfidence: result.extractionConfidence,
        extractionSignal: result.extractionSignal,
        ocrUsed: result.ocrUsed,
      },
    });
  } catch (error) {
    console.error('Error in import preview:', error);
    const localized = getImportErrorResponse(error, request);
    if (localized) {
      return localized;
    }
    return NextResponse.json(
      { error: 'Failed to parse document', errorCode: 'PARSE_FAILED' },
      { status: 500 }
    );
  }
}
