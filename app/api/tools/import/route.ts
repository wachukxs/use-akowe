import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// Simplified import preview for lead magnet (no auth required)
// Returns limited preview to encourage signup

interface ReadinessGap {
  type: 'missing_section' | 'low_citations' | 'short_section' | 'no_methodology' | 'weak_structure';
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
}> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  let text = '';
  
  if (extension === 'txt') {
    text = await file.text();
  } else if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else if (extension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rawText = buffer.toString('utf-8');
    const matches = rawText.match(/[\x20-\x7E\n\r]+/g) || [];
    text = matches.join(' ').substring(0, 20000);
  } else {
    throw new Error('Unsupported file type');
  }
  
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
  
  let citationCount = 0;
  for (const pattern of citationPatterns) {
    const matches = text.match(pattern);
    if (matches) citationCount += matches.length;
  }
  
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
  
  // Ensure score stays in bounds
  score = Math.max(0, Math.min(100, score));
  
  return {
    title,
    sections: sections.slice(0, 5), // Limit to 5 sections for preview
    wordCount,
    citationCount,
    readinessScore: score,
    gaps: gaps.slice(0, 4), // Limit to 4 gaps for preview
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file
    const allowedExtensions = ['docx', 'pdf', 'txt'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use .docx, .pdf, or .txt' },
        { status: 400 }
      );
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum 10MB for free preview.' },
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
      },
    });
  } catch (error) {
    console.error('Error in import preview:', error);
    return NextResponse.json(
      { error: 'Failed to parse document' },
      { status: 500 }
    );
  }
}
