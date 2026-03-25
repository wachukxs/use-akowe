import { NextRequest, NextResponse } from 'next/server';

// Reference Checker — lead magnet tool (no auth required)
// Parses a pasted reference list and validates entries against Crossref

interface ReferenceResult {
  raw: string;
  index: number;
  doi?: string;
  status: 'valid' | 'unresolvable' | 'no-doi' | 'malformed';
  resolvedTitle?: string;
  resolvedYear?: number;
  resolvedAuthors?: string[];
  issues: string[];
}

/**
 * Very simple heuristic to extract a DOI from a reference string.
 * Handles: doi:10.xxx, https://doi.org/10.xxx, bare 10.xxx/...
 */
function extractDOI(ref: string): string | undefined {
  // Full URL form
  const urlMatch = ref.match(/https?:\/\/doi\.org\/(10\.\d{4,}\/[^\s,)]+)/i);
  if (urlMatch) return urlMatch[1];

  // doi: prefix
  const prefixMatch = ref.match(/\bdoi:\s*(10\.\d{4,}\/[^\s,)]+)/i);
  if (prefixMatch) return prefixMatch[1];

  // Bare DOI at end or in parens
  const bareMatch = ref.match(/\b(10\.\d{4,}\/[^\s,)\]]+)/);
  if (bareMatch) return bareMatch[1];

  return undefined;
}

/**
 * Detect basic structural issues in a reference without DOI resolution.
 */
function lintReference(ref: string): string[] {
  const issues: string[] = [];
  const trimmed = ref.trim();

  // Must have a year (4-digit number likely to be a publication year)
  if (!/\b(19|20)\d{2}\b/.test(trimmed)) {
    issues.push('No publication year found');
  }

  // Must have author-like content (capital letter followed by comma or period)
  if (!/[A-Z][a-z]+[,.]/.test(trimmed)) {
    issues.push('Author name format unclear');
  }

  // Should have a title (something in quotes or after year, before journal)
  // Very loose check — if it's very short it's probably incomplete
  if (trimmed.length < 40) {
    issues.push('Reference appears incomplete (too short)');
  }

  // Check for common APA/MLA/Chicago patterns
  const hasJournalHint = /\bjournal\b|\bvol\b|\bvolume\b|\bpp?\.\s*\d|\bno\.\s*\d|\bissue\b/i.test(trimmed);
  const hasBookHint = /\bpress\b|\bpublishers?\b|\buniversity\b|\bedition\b|\bchapter\b/i.test(trimmed);
  if (!hasJournalHint && !hasBookHint) {
    issues.push('Cannot determine source type (journal/book)');
  }

  return issues;
}

/**
 * Resolve a DOI against Crossref and return metadata.
 */
async function resolveDOI(doi: string): Promise<{
  valid: boolean;
  title?: string;
  year?: number;
  authors?: string[];
}> {
  try {
    const res = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
      { signal: AbortSignal.timeout(6000) }
    );

    if (res.status === 404) return { valid: false };
    if (!res.ok) return { valid: true }; // Server error — don't penalise

    const data = await res.json();
    const work = data.message;

    const year =
      work['published-print']?.['date-parts']?.[0]?.[0] ||
      work['published-online']?.['date-parts']?.[0]?.[0] ||
      work.issued?.['date-parts']?.[0]?.[0];

    const authors = (work.author || [])
      .slice(0, 3)
      .map((a: { given?: string; family?: string }) =>
        [a.given, a.family].filter(Boolean).join(' ')
      );

    return {
      valid: true,
      title: work.title?.[0],
      year,
      authors,
    };
  } catch {
    // Timeout — don't flag as invalid
    return { valid: true };
  }
}

/**
 * Split a pasted reference list into individual references.
 * Handles numbered lists (1. 2. [1] [2]), blank-line separation, and hanging-indent blocks.
 */
function splitReferences(text: string): string[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // If lines start with numbers or brackets, treat each as a reference
  const numberedPattern = /^(\[\d+\]|\d+[\.\)])\s/;
  if (lines.filter(l => numberedPattern.test(l)).length >= 2) {
    return lines
      .filter(l => numberedPattern.test(l))
      .map(l => l.replace(numberedPattern, '').trim())
      .filter(l => l.length > 10);
  }

  // Otherwise split on blank lines, treating multi-line blocks as one reference
  const refs: string[] = [];
  let current = '';
  for (const line of lines) {
    if (line === '') {
      if (current.trim()) refs.push(current.trim());
      current = '';
    } else {
      current += (current ? ' ' : '') + line;
    }
  }
  if (current.trim()) refs.push(current.trim());

  // If no blank-line separation found, treat each non-empty line as a reference
  return refs.length >= 1
    ? refs.filter(r => r.length > 10)
    : lines.filter(l => l.length > 10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawText: string = body.text || '';

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please paste at least one reference' },
        { status: 400 }
      );
    }

    if (rawText.length > 20000) {
      return NextResponse.json(
        { error: 'Too many references. Please paste up to 30 references at a time.' },
        { status: 400 }
      );
    }

    const refs = splitReferences(rawText).slice(0, 30);

    if (refs.length === 0) {
      return NextResponse.json(
        { error: 'Could not parse any references. Make sure each reference is on its own line or separated by a blank line.' },
        { status: 400 }
      );
    }

    // For the free tool: process first 5, lock the rest
    const FREE_LIMIT = 5;
    const toProcess = refs.slice(0, FREE_LIMIT);
    const lockedCount = Math.max(0, refs.length - FREE_LIMIT);

    // Process each reference
    const results: ReferenceResult[] = await Promise.all(
      toProcess.map(async (ref, index) => {
        const doi = extractDOI(ref);
        const structuralIssues = lintReference(ref);
        const result: ReferenceResult = {
          raw: ref.length > 120 ? ref.slice(0, 120) + '…' : ref,
          index: index + 1,
          doi,
          status: 'no-doi',
          issues: structuralIssues,
        };

        if (doi) {
          const resolved = await resolveDOI(doi);
          if (!resolved.valid) {
            result.status = 'unresolvable';
            result.issues.unshift('DOI not found in Crossref — may be incorrect or unpublished');
          } else {
            result.status = 'valid';
            result.resolvedTitle = resolved.title;
            result.resolvedYear = resolved.year;
            result.resolvedAuthors = resolved.authors;
            // Clear structural issues if Crossref confirmed it
            result.issues = [];
          }
        } else if (structuralIssues.length > 0) {
          result.status = 'malformed';
        }

        return result;
      })
    );

    const validCount = results.filter(r => r.status === 'valid').length;
    const issueCount = results.filter(r => r.status !== 'valid').length;

    return NextResponse.json({
      totalParsed: refs.length,
      processed: results,
      lockedCount,
      summary: {
        valid: validCount,
        issues: issueCount,
        noDoi: results.filter(r => r.status === 'no-doi').length,
        unresolvable: results.filter(r => r.status === 'unresolvable').length,
        malformed: results.filter(r => r.status === 'malformed').length,
      },
      isLimited: lockedCount > 0,
    });
  } catch (error) {
    console.error('Error in reference checker:', error);
    return NextResponse.json({ error: 'Failed to check references' }, { status: 500 });
  }
}
