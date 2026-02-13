import type { Citation, LitReviewAnalysis, LitReviewTheme, LitReviewGap } from '@/types';

const MAX_CITATIONS = 30;
const MIN_CITATIONS = 3;
const MAX_ABSTRACT_LENGTH = 300;

interface AnalysisCitation {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  abstract?: string;
}

export function validateAnalysisRequest(citations: AnalysisCitation[]): {
  valid: boolean;
  error?: string;
  filtered: AnalysisCitation[];
} {
  if (!citations || citations.length < MIN_CITATIONS) {
    return {
      valid: false,
      error: `Add at least ${MIN_CITATIONS} citations to analyze your literature.`,
      filtered: [],
    };
  }

  // Truncate to max citations (most recent first, assuming last added = most recent)
  const filtered = citations.slice(-MAX_CITATIONS);

  return { valid: true, filtered };
}

export function buildAnalysisPrompt(
  citations: AnalysisCitation[],
  topic: string,
  methodology: string,
  citationStyle: string
): { system: string; user: string } {
  const system = `You are an academic research analyst. Analyze the following citations from a student's research project and identify thematic connections, agreements, contradictions, and research gaps.

The student's project:
- Topic: ${topic}
- Methodology: ${methodology}
- Citation style: ${citationStyle}

Rules:
1. Identify 2-6 themes depending on the number and diversity of citations.
2. For each theme, classify every relevant paper's stance as "supports", "contradicts", or "discusses". Not every paper needs to appear in every theme.
3. For contradicting papers, provide a specific 1-sentence reason explaining the disagreement.
4. For supporting/discussing papers, provide a brief reason.
5. Identify 1-4 research gaps based on what's missing from the collective literature.
6. For each gap, suggest a search query (5-8 words) that could find papers addressing it.
7. Write a 2-3 sentence summary of the overall research landscape.
8. Use citation IDs exactly as provided — do not modify them.
9. Only reference papers from the provided list — do not invent citations.

Respond ONLY with valid JSON matching this schema exactly:
{
  "themes": [
    {
      "name": "string (5-10 words)",
      "description": "string (1-2 sentences)",
      "papers": [
        {
          "citationId": "string (exact ID from input)",
          "stance": "supports | contradicts | discusses",
          "reasoning": "string (1 sentence)"
        }
      ]
    }
  ],
  "gaps": [
    {
      "title": "string (3-8 words)",
      "description": "string (2-3 sentences explaining what's missing)",
      "suggestion": "string (1-2 sentences on how this helps the student)",
      "searchQuery": "string (5-8 word search query)"
    }
  ],
  "summary": "string (2-3 sentences)"
}`;

  const citationList = citations
    .map((c, i) => {
      const abstract = c.abstract
        ? c.abstract.length > MAX_ABSTRACT_LENGTH
          ? c.abstract.substring(0, MAX_ABSTRACT_LENGTH) + '...'
          : c.abstract
        : 'No abstract available';

      return `[${i + 1}] ID: ${c.id}
Title: ${c.title}
Authors: ${c.authors.join(', ')}
Year: ${c.year || 'n.d.'}
Journal: ${c.journal || 'Unknown'}
Abstract: ${abstract}`;
    })
    .join('\n---\n');

  const user = `Here are my ${citations.length} citations:\n\n${citationList}\n\nAnalyze these citations for my research on "${topic}" using ${methodology} methodology.`;

  return { system, user };
}

export function parseAnalysisResponse(
  raw: string,
  validCitationIds: Set<string>
): LitReviewAnalysis | null {
  try {
    // Try to extract JSON from the response (handle markdown code blocks)
    let jsonStr = raw.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and clean themes
    const themes: LitReviewTheme[] = (parsed.themes || [])
      .map((theme: { name?: string; description?: string; papers?: Array<{ citationId?: string; stance?: string; reasoning?: string }> }, idx: number) => {
        const validPapers = (theme.papers || []).filter(
          (p: { citationId?: string; stance?: string }) =>
            p.citationId &&
            validCitationIds.has(p.citationId) &&
            ['supports', 'contradicts', 'discusses'].includes(p.stance || '')
        );

        if (validPapers.length === 0) return null;

        return {
          id: `theme_${idx}`,
          name: theme.name || `Theme ${idx + 1}`,
          description: theme.description || '',
          papers: validPapers.map((p) => ({
            citationId: p.citationId!,
            stance: p.stance as 'supports' | 'contradicts' | 'discusses',
            reasoning: (p as { reasoning?: string }).reasoning || '',
          })),
        };
      })
      .filter(Boolean) as LitReviewTheme[];

    // Validate gaps
    const gaps: LitReviewGap[] = (parsed.gaps || []).map(
      (gap: { title?: string; description?: string; suggestion?: string; searchQuery?: string }, idx: number) => ({
        id: `gap_${idx}`,
        title: gap.title || `Gap ${idx + 1}`,
        description: gap.description || '',
        suggestion: gap.suggestion || '',
        searchQuery: gap.searchQuery,
      })
    );

    const summary = parsed.summary || '';

    return {
      themes,
      gaps,
      summary,
      analyzedAt: new Date(),
      citationCount: validCitationIds.size,
      citationIds: Array.from(validCitationIds),
    };
  } catch {
    return null;
  }
}

export function buildSynthesisPrompt(
  type: 'theme' | 'gap',
  data: {
    theme?: {
      name: string;
      description: string;
      papers: Array<{
        title: string;
        citationText: string;
        stance: string;
        reasoning: string;
      }>;
    };
    gap?: {
      title: string;
      description: string;
      suggestion: string;
    };
  },
  topic: string,
  methodology: string,
  citationStyle: string
): { system: string; user: string } {
  if (type === 'theme' && data.theme) {
    const system = `You are an academic writing assistant. Write a synthesis paragraph for a literature review section that weaves together the following research papers around a common theme.

Project context:
- Topic: ${topic}
- Methodology: ${methodology}
- Citation style: ${citationStyle}

Rules:
1. Write ONE cohesive paragraph (60-120 words) that synthesizes the papers.
2. Do NOT list papers one by one. Synthesize and connect ideas.
3. Use the EXACT citation text provided for each paper — do not reformat citations.
4. When multiple papers support the same point, group their citations, e.g., "(Martinez, 2024; Chen et al., 2023)".
5. If contradicting papers exist, use transition words: "However," "In contrast," "Nevertheless,".
6. Write in third person, academic tone.
7. Do NOT start with "The literature shows" or "Several studies" — vary your openings.
8. Do NOT add a concluding sentence about future research.
9. Output the paragraph only. No headers, no labels, no markdown.`;

    const papersText = data.theme.papers
      .map(
        (p) =>
          `- ${p.title} (Citation: ${p.citationText})\n  Stance: ${p.stance}\n  Reason: ${p.reasoning}`
      )
      .join('\n');

    const user = `Theme: ${data.theme.name}
Description: ${data.theme.description}

Papers in this theme:

${papersText}

Write a synthesis paragraph connecting these papers for my literature review on "${topic}".`;

    return { system, user };
  }

  // Gap synthesis
  const system = `You are an academic writing assistant. Write a paragraph for a literature review section that identifies and discusses a gap in the existing research.

Project context:
- Topic: ${topic}
- Methodology: ${methodology}

Rules:
1. Write ONE paragraph (40-80 words) that identifies this gap in the literature.
2. Reference what IS covered by the existing research, then pivot to what's missing.
3. Suggest why this gap matters for the field.
4. Write in third person, academic tone.
5. Do NOT propose specific solutions — just identify and explain the gap.
6. Output the paragraph only. No headers, no labels, no markdown.`;

  const gap = data.gap!;
  const user = `Research gap: ${gap.title}
Description: ${gap.description}
Why it matters: ${gap.suggestion}

Write a paragraph identifying this gap in the literature for my research on "${topic}".`;

  return { system, user };
}

export function cleanSynthesisResponse(raw: string): string {
  let text = raw.trim();

  // Strip markdown headers
  text = text.replace(/^#+\s+.*\n?/gm, '');

  // Strip leading labels
  text = text.replace(/^(Synthesis|Paragraph|Output|Result|Gap Analysis):\s*/i, '');

  // Strip wrapping quotes
  if (text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1);
  }

  return text.trim();
}

export function getCitationStats(citations: Citation[]): {
  count: number;
  yearRange: string;
  journalCount: number;
  primaryAuthors: string[];
  missingAbstracts: number;
} {
  const count = citations.length;

  const years = citations
    .map((c) => c.year)
    .filter((y): y is number => typeof y === 'number')
    .sort();
  const yearRange =
    years.length > 0 ? `${years[0]}–${years[years.length - 1]}` : 'n.d.';

  const journals = new Set(
    citations.map((c) => c.journal).filter(Boolean)
  );
  const journalCount = journals.size;

  // Get most common first authors
  const authorCounts = new Map<string, number>();
  for (const c of citations) {
    const first = c.authors?.[0];
    if (first) {
      const name = first.split(' ').pop() || first; // last name
      authorCounts.set(name, (authorCounts.get(name) || 0) + 1);
    }
  }
  const primaryAuthors = Array.from(authorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);

  // Count citations that are from Crossref discovery (they have abstracts)
  // vs parsed/manual (likely no abstract)
  const missingAbstracts = citations.filter(
    (c) => !(c as Citation & { abstract?: string }).abstract ||
           (c as Citation & { abstract?: string }).abstract === 'No abstract available.' ||
           (c as Citation & { abstract?: string }).abstract === 'No abstract available'
  ).length;

  return { count, yearRange, journalCount, primaryAuthors, missingAbstracts };
}

export function detectStaleness(
  analysis: LitReviewAnalysis | null,
  currentCitationIds: string[]
): { isStale: boolean; added: number; removed: number } {
  if (!analysis) return { isStale: false, added: 0, removed: 0 };

  const analyzedSet = new Set(analysis.citationIds);
  const currentSet = new Set(currentCitationIds);

  const added = currentCitationIds.filter((id) => !analyzedSet.has(id)).length;
  const removed = analysis.citationIds.filter((id) => !currentSet.has(id)).length;

  return {
    isStale: added > 0 || removed > 0,
    added,
    removed,
  };
}
