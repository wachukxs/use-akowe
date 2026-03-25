import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// Enhanced plagiarism check for lead magnet (no auth required)
// Returns limited but valuable results to encourage signup

interface SourceMatch {
  title: string;
  doi?: string;
  authors: string[];
  year?: number;
  journal?: string;
  url: string;
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

  const citationPatterns = [
    /\([A-Za-z]+(?:,?\s+et\s+al\.?)?,?\s*\d{4}\)/,
    /\[[A-Za-z]+(?:,?\s+et\s+al\.?)?,?\s*\d{4}\]/,
    /\([A-Za-z]+\s+&\s+[A-Za-z]+,?\s*\d{4}\)/,
    /\[\d+\]/,
  ];

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

  for (const sentence of sentences) {
    let hasCitation = false;
    for (const citPattern of citationPatterns) {
      if (citPattern.test(sentence)) {
        hasCitation = true;
        break;
      }
    }

    if (hasCitation) continue;

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

  // 1. Check for uncited claims
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

  // 3. Check for word repetition
  const stopWords = new Set(['about', 'after', 'being', 'between', 'could', 'different', 'during', 'every', 'first', 'found', 'great', 'however', 'including', 'might', 'other', 'people', 'should', 'since', 'still', 'their', 'there', 'these', 'thing', 'think', 'those', 'through', 'using', 'where', 'which', 'while', 'would', 'years']);
  const words = text.toLowerCase()
    .split(/\s+/)
    .filter(w => {
      if (w.length < 5) return false;
      if (/^\d+$/.test(w)) return false;
      if (/^[^a-z]+$/.test(w)) return false;
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

  // 4. Check for weak academic writing
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

// ─── Real database checks ───────────────────────────────────────────────────

const SEARCH_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'this', 'that', 'these', 'those', 'is',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'must', 'can', 'it', 'its', 'their', 'they', 'we', 'our',
  'as', 'not', 'no', 'so', 'if', 'also', 'into', 'than', 'such',
  'more', 'very', 'both', 'each', 'most', 'other', 'some', 'through',
  'during', 'before', 'after', 'about', 'then', 'when', 'where', 'which',
]);

/**
 * Extract substantive phrases from uncited sentences to query against OpenAlex.
 * Picks the longest sentences that don't already contain a citation marker.
 */
function extractSearchPhrases(text: string, limit = 3): string[] {
  const citationPattern = /\([A-Za-z][^)]*\d{4}\)|\[\d+\]|doi:|https?:\/\//i;

  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.split(/\s+/).length >= 8 && !citationPattern.test(s) && s.length >= 40)
    .sort((a, b) => b.length - a.length)
    .slice(0, limit)
    .map(s => {
      const contentWords = s
        .split(/\s+/)
        .map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
        .filter(w => w.length > 3 && !SEARCH_STOP_WORDS.has(w));
      return contentWords.slice(0, 7).join(' ');
    })
    .filter(p => p.length > 10);
}

/**
 * Query OpenAlex for papers related to the given phrases.
 * Uses the free OpenAlex API — no key required, just a mailto for polite access.
 */
async function searchOpenAlexForMatches(phrases: string[]): Promise<SourceMatch[]> {
  const email = process.env.OPENALEX_EMAIL || 'contact@useakowe.com';
  const matches: SourceMatch[] = [];
  const seen = new Set<string>();

  await Promise.allSettled(
    phrases.slice(0, 3).map(async (phrase) => {
      try {
        const url = `https://api.openalex.org/works?search=${encodeURIComponent(phrase)}&mailto=${encodeURIComponent(email)}&per-page=2&select=id,doi,title,authorships,publication_year,primary_location`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) return;

        const data = await res.json();
        for (const work of (data.results || [])) {
          if (!work.title) continue;
          const key = work.doi || work.id;
          if (seen.has(key)) continue;
          seen.add(key);

          matches.push({
            title: work.title,
            doi: work.doi?.replace('https://doi.org/', ''),
            authors: (work.authorships || [])
              .slice(0, 2)
              .map((a: { author?: { display_name?: string } }) => a.author?.display_name)
              .filter(Boolean),
            year: work.publication_year,
            journal: work.primary_location?.source?.display_name,
            url: work.doi || work.id,
          });
        }
      } catch {
        // Timeout or network error — silent fail, local analysis still runs
      }
    })
  );

  return matches;
}

/**
 * Extract any DOI strings already referenced in the text.
 */
function extractDOIsFromText(text: string): string[] {
  const doiPattern = /\b10\.\d{4,}\/[^\s)>\]"',;]+/gi;
  const found = text.match(doiPattern) || [];
  return [...new Set(found)].slice(0, 5);
}

/**
 * Verify each DOI resolves against Crossref.
 * Returns which ones are valid and which return 404.
 */
async function verifyCrossrefDOIs(dois: string[]): Promise<{ valid: string[]; invalid: string[] }> {
  const valid: string[] = [];
  const invalid: string[] = [];

  await Promise.allSettled(
    dois.map(async (doi) => {
      try {
        const res = await fetch(
          `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (res.ok) {
          valid.push(doi);
        } else if (res.status === 404) {
          invalid.push(doi);
        }
        // Any other status (rate limit, server error) — skip silently
      } catch {
        // Timeout — don't penalise the student
      }
    })
  );

  return { valid, invalid };
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

    const limitedText = text.substring(0, 5000);

    // Run local analysis and real database checks in parallel
    const localResult = enhancedPlagiarismCheck(limitedText);
    const phrases = extractSearchPhrases(limitedText);
    const textDOIs = extractDOIsFromText(limitedText);

    const [sourceMatches, doiResults] = await Promise.all([
      phrases.length > 0 ? searchOpenAlexForMatches(phrases) : Promise.resolve([]),
      textDOIs.length > 0
        ? verifyCrossrefDOIs(textDOIs)
        : Promise.resolve({ valid: [], invalid: [] }),
    ]);

    // If unverifiable DOIs found, add them as issues
    const invalidDoiCount = doiResults.invalid.length;

    return NextResponse.json({
      riskScore: localResult.riskScore,
      previewIssues: localResult.issues.slice(0, 2),
      totalIssues: localResult.totalIssues + invalidDoiCount,
      wordCount: limitedText.split(/\s+/).length,
      summary: {
        citationIssues: localResult.citationIssues,
        aiPatterns: localResult.aiPatterns,
        repetitionIssues: localResult.repetitionIssues,
        writingIssues: localResult.writingIssues,
      },
      // Real OpenAlex source matches (show 1 free, rest locked)
      sourceMatches: sourceMatches.slice(0, 1),
      totalSourceMatches: sourceMatches.length,
      // Crossref DOI verification
      invalidDOIs: doiResults.invalid.slice(0, 2),
      validDOICount: doiResults.valid.length,
      checksPerformed: [
        { name: 'Citation patterns', count: localResult.citationIssues, status: localResult.citationIssues === 0 ? 'pass' : 'issues' },
        { name: 'AI writing patterns', count: localResult.aiPatterns, status: localResult.aiPatterns === 0 ? 'pass' : 'issues' },
        { name: 'Word repetition', count: localResult.repetitionIssues, status: localResult.repetitionIssues === 0 ? 'pass' : 'issues' },
        {
          name: 'OpenAlex (250M+ academic papers)',
          count: sourceMatches.length,
          status: sourceMatches.length > 0 ? 'issues' : 'pass',
        },
        {
          name: 'Crossref full abstract matching',
          count: null,
          status: 'locked',
        },
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
