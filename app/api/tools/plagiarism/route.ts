import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// Enhanced plagiarism check for lead magnet (no auth required)
// Returns limited but valuable results to encourage signup

function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? Math.round((intersection.size / union.size) * 100) : 0;
}

async function parseFile(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'txt') {
    return await file.text();
  }
  
  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  
  if (extension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const text = buffer.toString('utf-8');
    const matches = text.match(/[\x20-\x7E\n\r]+/g) || [];
    return matches.join(' ').substring(0, 10000);
  }
  
  throw new Error('Unsupported file type');
}

// Check for claims that need citations
function findUncistedClaims(text: string): Array<{ text: string; type: string; suggestion: string }> {
  const issues: Array<{ text: string; type: string; suggestion: string }> = [];
  
  const claimPatterns = [
    { pattern: /studies\s+(?:have\s+)?show(?:n|s)?/i, suggestion: 'Cite the specific studies' },
    { pattern: /research\s+(?:has\s+)?(?:indicate[sd]?|suggest[sd]?|show[sn]?|demonstrate[sd]?)/i, suggestion: 'Add a reference to the research' },
    { pattern: /according\s+to\s+(?:research|studies|experts)/i, suggestion: 'Specify the source and add citation' },
    { pattern: /it\s+(?:is|has\s+been)\s+(?:proven|established|demonstrated|shown)/i, suggestion: 'Add citation to support this claim' },
    { pattern: /experts?\s+(?:agree|believe|suggest|argue)/i, suggestion: 'Name the experts and cite their work' },
    { pattern: /evidence\s+(?:suggests?|shows?|indicates?)/i, suggestion: 'Cite the evidence source' },
    { pattern: /(?:recent|previous|earlier)\s+(?:research|studies|findings)/i, suggestion: 'Specify which research and add citation' },
    { pattern: /(?:many|most|some)\s+(?:researchers?|scholars?|scientists?)\s+(?:believe|argue|suggest)/i, suggestion: 'Cite specific researchers' },
    { pattern: /it\s+is\s+widely\s+(?:known|accepted|believed|recognized)/i, suggestion: 'Add citation or rephrase' },
    { pattern: /(?:data|statistics|figures)\s+(?:show|indicate|suggest|reveal)/i, suggestion: 'Cite the data source' },
  ];
  
  // Check for citation presence patterns
  const citationPatterns = [
    /\([A-Za-z]+(?:,?\s+et\s+al\.?)?,?\s*\d{4}\)/,
    /\[[A-Za-z]+(?:,?\s+et\s+al\.?)?,?\s*\d{4}\]/,
    /\([A-Za-z]+\s+&\s+[A-Za-z]+,?\s*\d{4}\)/,
    /\[\d+\]/,
  ];
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  for (const sentence of sentences) {
    // Check if sentence has a citation
    let hasCitation = false;
    for (const citPattern of citationPatterns) {
      if (citPattern.test(sentence)) {
        hasCitation = true;
        break;
      }
    }
    
    if (hasCitation) continue;
    
    // Check if sentence contains a claim pattern
    for (const { pattern, suggestion } of claimPatterns) {
      if (pattern.test(sentence)) {
        issues.push({
          text: sentence.trim().substring(0, 80) + (sentence.length > 80 ? '...' : ''),
          type: 'Missing citation',
          suggestion,
        });
        break;
      }
    }
  }
  
  return issues;
}

function enhancedPlagiarismCheck(text: string): {
  riskScore: number;
  issues: Array<{ text: string; type: string; suggestion: string }>;
  totalIssues: number;
  citationIssues: number;
  aiPatterns: number;
  repetitionIssues: number;
  writingIssues: number;
} {
  const issues: Array<{ text: string; type: string; suggestion: string }> = [];
  let citationIssues = 0;
  let aiPatterns = 0;
  let repetitionIssues = 0;
  let writingIssues = 0;
  
  // 1. Check for uncited claims (most valuable for academics)
  const uncitedClaims = findUncistedClaims(text);
  citationIssues = uncitedClaims.length;
  issues.push(...uncitedClaims);
  
  // 2. Check for AI-like patterns
  const aiPatternList = [
    { pattern: /it is important to note that/gi, type: 'AI pattern', suggestion: 'Rephrase for more natural academic flow' },
    { pattern: /in conclusion,?\s*it can be said/gi, type: 'AI pattern', suggestion: 'Write a more original conclusion' },
    { pattern: /this essay will explore/gi, type: 'Weak opening', suggestion: 'Start with your argument directly' },
    { pattern: /in this paper,?\s*we will/gi, type: 'Weak opening', suggestion: 'Lead with your thesis statement' },
    { pattern: /furthermore,?\s*it is worth mentioning/gi, type: 'AI pattern', suggestion: 'Be more direct' },
    { pattern: /delve into/gi, type: 'AI pattern', suggestion: 'Use "examine" or "analyze" instead' },
    { pattern: /it is evident that/gi, type: 'AI pattern', suggestion: 'Provide evidence instead of stating obviousness' },
    { pattern: /plays a (?:crucial|vital|important) role/gi, type: 'AI pattern', suggestion: 'Be more specific about the role' },
    { pattern: /in today's (?:society|world|age)/gi, type: 'Cliché', suggestion: 'Be more specific about the context' },
    { pattern: /since the dawn of time/gi, type: 'Cliché', suggestion: 'Use a precise timeframe' },
  ];
  
  for (const { pattern, type, suggestion } of aiPatternList) {
    const matches = text.match(pattern);
    if (matches) {
      aiPatterns += matches.length;
      for (const match of matches.slice(0, 2)) {
        issues.push({ text: match, type, suggestion });
      }
    }
  }
  
  // 3. Check for word repetition (filter out junk)
  const stopWords = new Set(['about', 'after', 'being', 'between', 'could', 'different', 'during', 'every', 'first', 'found', 'great', 'however', 'including', 'might', 'other', 'people', 'should', 'since', 'still', 'their', 'there', 'these', 'thing', 'think', 'those', 'through', 'using', 'where', 'which', 'while', 'would', 'years']);
  const words = text.toLowerCase()
    .split(/\s+/)
    .filter(w => {
      // Must be 5+ chars, not a number, not a stopword
      if (w.length < 5) return false;
      if (/^\d+$/.test(w)) return false; // Filter numeric-only like "00000"
      if (/^[^a-z]+$/.test(w)) return false; // Filter non-alphabetic
      if (stopWords.has(w)) return false;
      return true;
    });
  
  const wordCounts: Record<string, number> = {};
  for (const word of words) {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  }
  
  const overusedWords = Object.entries(wordCounts)
    .filter(([word, count]) => count > 5 && word.length >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  repetitionIssues = overusedWords.length;
  for (const [word, count] of overusedWords) {
    issues.push({
      text: `"${word}" used ${count} times`,
      type: 'Repetition',
      suggestion: `Consider using synonyms for "${word}"`,
    });
  }
  
  // 4. Check for weak academic writing patterns
  const weakPatterns = [
    { pattern: /\bvery\b/gi, type: 'Weak modifier', suggestion: 'Use a stronger, more precise word' },
    { pattern: /\breally\b/gi, type: 'Weak modifier', suggestion: 'Remove or use more academic language' },
    { pattern: /\bthings?\b/gi, type: 'Vague term', suggestion: 'Be more specific' },
    { pattern: /\ba lot\b/gi, type: 'Informal', suggestion: 'Use "many", "numerous", or be specific' },
  ];
  
  for (const { pattern, type, suggestion } of weakPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 3) {
      writingIssues++;
      issues.push({
        text: `"${matches[0]}" appears ${matches.length} times`,
        type,
        suggestion,
      });
    }
  }
  
  // Calculate risk score based on issue density
  const wordCount = text.split(/\s+/).length;
  const issueWeight = (citationIssues * 3) + (aiPatterns * 2) + repetitionIssues + writingIssues;
  const riskScore = Math.min(Math.round((issueWeight / Math.max(wordCount / 100, 1)) * 8), 85);
  
  return {
    riskScore,
    issues,
    totalIssues: issues.length,
    citationIssues,
    aiPatterns,
    repetitionIssues,
    writingIssues,
  };
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let text = '';
    let metadata: { charCount?: number; fileType?: string; fileName?: string } = {};
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      
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
          { error: 'File too large. Maximum 10MB for free check.' },
          { status: 400 }
        );
      }
      
      text = await parseFile(file);
      metadata = { fileType: extension, fileName: file.name };
    } else {
      const body = await request.json();
      text = body.text || '';
      metadata = { charCount: text.length };
    }
    
    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Please provide at least 50 characters of text' },
        { status: 400 }
      );
    }
    
    // Limit text for free check
    const limitedText = text.substring(0, 5000);
    
    const result = enhancedPlagiarismCheck(limitedText);
    
    // Return enhanced results with checks performed summary
    return NextResponse.json({
      riskScore: result.riskScore,
      previewIssues: result.issues.slice(0, 2), // Show 2 sample issues
      totalIssues: result.totalIssues,
      wordCount: limitedText.split(/\s+/).length,
      // Summary stats for conversion
      summary: {
        citationIssues: result.citationIssues,
        aiPatterns: result.aiPatterns,
        repetitionIssues: result.repetitionIssues,
        writingIssues: result.writingIssues,
      },
      // Checks performed - always show what we checked
      checksPerformed: [
        { name: 'Citation patterns', count: result.citationIssues, status: result.citationIssues === 0 ? 'pass' : 'issues' },
        { name: 'AI patterns', count: result.aiPatterns, status: result.aiPatterns === 0 ? 'pass' : 'issues' },
        { name: 'Word repetition', count: result.repetitionIssues, status: result.repetitionIssues === 0 ? 'pass' : 'issues' },
        { name: 'CrossRef & arXiv (130M+ papers)', count: null, status: 'locked' },
      ],
      isLimited: true,
      metadata,
    });
  } catch (error) {
    console.error('Error in plagiarism preview:', error);
    return NextResponse.json(
      { error: 'Failed to analyze text' },
      { status: 500 }
    );
  }
}
