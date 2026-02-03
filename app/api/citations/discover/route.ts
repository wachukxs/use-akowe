import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import {
  calculateTopicRelevanceScore,
  isTopicRelevant,
  type CitationLike,
} from '@/lib/citation-relevance';
import {
  getCrossrefOffset,
  hasMoreResults,
} from '@/lib/citation-discovery-pagination';
import {
  extractPublicationYearFromCrossref,
  formatYearForDisplay,
  type CrossrefWorkLike,
} from '@/lib/citation-year';

const DISCOVER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const discoverCache = new Map<
  string,
  { citations: unknown[]; searchTerm: string; hasMore: boolean; totalResults?: number; ts: number }
>();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      topic,
      projectType,
      citationStyle,
      methodology,
      searchQuery,
      limit = 5,
      offset = 0,
    } = body;

    const searchTerm = searchQuery || topic;

    if (!searchTerm) {
      return NextResponse.json({ error: 'Search query or topic is required' }, { status: 400 });
    }

    const cacheKey = `${searchTerm}|${citationStyle}|${limit}|${offset}|${methodology ?? ''}|${projectType ?? ''}`;
    const cached = discoverCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < DISCOVER_CACHE_TTL_MS) {
      return NextResponse.json({
        citations: cached.citations,
        searchTerm: cached.searchTerm,
        hasMore: cached.hasMore,
        totalResults: cached.totalResults,
        message: `Found ${cached.citations.length} relevant citations for "${cached.searchTerm}"`,
      });
    }

    const result = await discoverCitationsWithContext(
      searchTerm,
      citationStyle,
      projectType,
      methodology,
      limit,
      offset
    );

    if (result.failed) {
      return NextResponse.json(
        {
          error: 'Citation search is temporarily unavailable. Please try again in a moment.',
          citations: [],
          searchTerm,
        },
        { status: 503 }
      );
    }

    const { citations, hasMore, totalResults } = result;
    discoverCache.set(cacheKey, { citations, searchTerm, hasMore, totalResults, ts: Date.now() });

    return NextResponse.json({
      citations,
      searchTerm,
      hasMore,
      totalResults,
      message: `Found ${citations.length} relevant citations for "${searchTerm}"`,
    });
  } catch (error) {
    console.error('Error discovering citations:', error);
    return NextResponse.json({ error: 'Failed to discover citations' }, { status: 500 });
  }
}

async function discoverCitationsWithContext(
  searchTerm: string,
  citationStyle: string,
  projectType: string,
  methodology: string,
  limit: number,
  offset: number
): Promise<{ citations: unknown[]; hasMore: boolean; totalResults?: number; failed?: boolean }> {
  try {
    const requestedRows = Math.min(Math.max(limit * 3, 15), 30);
    const crossrefOffset = getCrossrefOffset(offset, limit, requestedRows);
    const { citations: rawCitations, totalResults } = await discoverCitationsFromCrossref(
      searchTerm,
      citationStyle,
      requestedRows,
      crossrefOffset
    );

    const hasMore = hasMoreResults(
      crossrefOffset,
      rawCitations.length,
      totalResults
    );

    const seenDoi = new Set<string>();
    type RawItem = { doi?: string; [key: string]: unknown };
    const dedupedCitations = (rawCitations as RawItem[]).filter((c) => {
      const doi = (c.doi ?? '').toString().toLowerCase().trim();
      if (!doi || seenDoi.has(doi)) return false;
      seenDoi.add(doi);
      return true;
    });

    type DiscoveredCitation = {
      id: string;
      title?: string;
      abstract?: string;
      topicRelevanceScore?: number;
      [key: string]: unknown;
    };

    const withTopicScore: DiscoveredCitation[] = (dedupedCitations as DiscoveredCitation[]).map(
      (citation) => ({
        ...citation,
        topicRelevanceScore: calculateTopicRelevanceScore(
          citation as CitationLike,
          searchTerm
        ),
      })
    );

    const topicRelevant = withTopicScore.filter((c: DiscoveredCitation) =>
      isTopicRelevant(c as CitationLike, searchTerm)
    );

    const topicRelevantIds = new Set(topicRelevant.map((c: DiscoveredCitation) => c.id));

    const toRank =
      topicRelevant.length >= limit
        ? topicRelevant
        : [
            ...topicRelevant,
            ...withTopicScore.filter((c: DiscoveredCitation) => !topicRelevantIds.has(c.id)),
          ];

    const sortedByTopic = [...toRank].sort(
      (a: DiscoveredCitation, b: DiscoveredCitation) =>
        (b.topicRelevanceScore ?? 0) - (a.topicRelevanceScore ?? 0)
    );

    const trimmed = sortedByTopic.slice(0, limit);
    return {
      citations: enhanceCitationsWithContext(trimmed, projectType, methodology),
      hasMore,
      totalResults: typeof totalResults === 'number' && totalResults > 0 ? totalResults : undefined,
    };
  } catch (error) {
    console.error('Error in contextual citation discovery:', error);
    return { citations: [], hasMore: false, totalResults: undefined, failed: true };
  }
}

function enhanceCitationsWithContext(
  citations: Array<Record<string, unknown> & { topicRelevanceScore?: number }>,
  projectType: string,
  methodology: string
) {
  return citations
    .map((citation) => ({
      ...citation,
      relevanceScore: calculateRelevanceScore(citation, projectType, methodology),
      contextMatch: getContextMatch(citation, projectType, methodology),
    }))
    .sort((a, b) => {
      const topicA = a.topicRelevanceScore ?? 0;
      const topicB = b.topicRelevanceScore ?? 0;
      if (topicB !== topicA) return topicB - topicA;
      return (b.relevanceScore as number) - (a.relevanceScore as number);
    });
}

interface CitationData {
  title?: string;
  abstract?: string;
  year?: number;
  relevanceScore?: number;
  topicRelevanceScore?: number;
}

function calculateRelevanceScore(citation: CitationData, projectType: string, methodology: string): number {
  let score = 0;
  
  // Check title relevance
  const title = citation.title?.toLowerCase() || '';
  const abstract = citation.abstract?.toLowerCase() || '';
  const content = `${title} ${abstract}`;
  
  // Methodology scoring
  const methodologyKeywords = {
    'qualitative': ['qualitative', 'interview', 'observation', 'case study', 'ethnography'],
    'quantitative': ['quantitative', 'statistical', 'survey', 'experiment', 'analysis'],
    'mixed methods': ['mixed methods', 'triangulation', 'convergent', 'sequential'],
    'literature review': ['review', 'meta-analysis', 'systematic', 'synthesis'],
    'case study': ['case study', 'single case', 'multiple case', 'longitudinal']
  };
  
  const methodKeywords = methodologyKeywords[(methodology || 'qualitative').toLowerCase() as keyof typeof methodologyKeywords] || [];
  methodKeywords.forEach((keyword: string) => {
    if (content.includes(keyword)) score += 2;
  });
  
  // Project type scoring
  const projectTypeKeywords = {
    'essay': ['argument', 'perspective', 'analysis', 'discussion'],
    'thesis': ['dissertation', 'doctoral', 'research', 'investigation'],
    'journal': ['peer-reviewed', 'journal', 'academic', 'publication'],
    'research': ['empirical', 'study', 'investigation', 'experiment']
  };
  
  const typeKeywords = projectTypeKeywords[projectType.toLowerCase() as keyof typeof projectTypeKeywords] || [];
  typeKeywords.forEach((keyword: string) => {
    if (content.includes(keyword)) score += 1;
  });
  
  // Recency bonus (prefer recent papers) — only when year is known; never assume current year
  const paperYear = citation.year;
  if (typeof paperYear === 'number') {
    const currentYear = new Date().getFullYear();
    const yearDiff = currentYear - paperYear;
    if (yearDiff <= 5) score += 3;
    else if (yearDiff <= 10) score += 2;
    else if (yearDiff <= 15) score += 1;
  }

  return Math.max(0, score);
}

function getContextMatch(citation: CitationData, projectType: string, methodology: string): string {
  const title = citation.title?.toLowerCase() || '';
  const abstract = citation.abstract?.toLowerCase() || '';
  const content = `${title} ${abstract}`;
  
  // Check for methodology match
  const methodologyKeywords = {
    'qualitative': ['qualitative', 'interview', 'observation', 'case study'],
    'quantitative': ['quantitative', 'statistical', 'survey', 'experiment'],
    'mixed methods': ['mixed methods', 'triangulation'],
    'literature review': ['review', 'meta-analysis', 'systematic'],
    'case study': ['case study', 'single case', 'multiple case']
  };
  
  const methodKeywords = methodologyKeywords[(methodology || 'qualitative').toLowerCase() as keyof typeof methodologyKeywords] || [];
  const hasMethodMatch = methodKeywords.some((keyword: string) => content.includes(keyword));
  
  if (hasMethodMatch) {
    return `Matches ${methodology} methodology`;
  }
  
  return 'General relevance';
}

function isRetractedWork(work: { relation?: unknown }): boolean {
  const raw = work.relation;
  const relations = Array.isArray(raw) ? raw : [];
  return relations.some((r: { type?: string }) => r?.type === 'is-retracted-by');
}

async function discoverCitationsFromCrossref(
  topic: string,
  citationStyle: string,
  rows: number,
  offset: number
): Promise<{ citations: unknown[]; totalResults: number }> {
  try {
    const query = encodeURIComponent(topic);
    const url = `https://api.crossref.org/works?query=${query}&rows=${rows}&offset=${offset}&sort=relevance&order=desc`;

    const headers = {
      'User-Agent': 'Akowe Research Assistant (mailto:ola@placeholderllc.name.ng)',
      Accept: 'application/json',
    };

    let response = await fetch(url, { headers });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitMs = retryAfter ? Math.min(parseInt(retryAfter, 10) * 1000, 10000) : 2000;
      await new Promise((r) => setTimeout(r, waitMs));
      response = await fetch(url, { headers });
    }

    if (!response.ok) {
      throw new Error(`Crossref API error: ${response.status}`);
    }

    const data = await response.json();
    const items = data.message?.items || [];
    const totalResults =
      typeof data.message?.['total-results'] === 'number'
        ? data.message['total-results']
        : 0;

    const works = items.filter(
      (work: { relation?: Array<{ type?: string }> }) => !isRetractedWork(work)
    );

    const citations = works.map((work: { author?: Array<{ given?: string; family?: string }>; title?: string[]; 'container-title'?: string[]; publisher?: string; DOI?: string; URL?: string; abstract?: string; relation?: Array<{ type?: string }> }, index: number) => {
      const authors = work.author?.map((author: { given?: string; family?: string }) => 
        `${author.given || ''} ${author.family || ''}`.trim()
      ).join(', ') || 'Unknown Author';

      const title = work.title?.[0] || 'Untitled';
      const journal = work['container-title']?.[0] || work.publisher || 'Unknown Journal';
      const year = extractPublicationYearFromCrossref(work as CrossrefWorkLike);
      const yearDisplay = formatYearForDisplay(year);

      const doi = work.DOI || '';
      const url = doi ? `https://doi.org/${doi}` : work.URL || '';

      // Generate citation text based on style (use "n.d." when year is unknown)
      let citationText = '';
      switch (citationStyle) {
        case 'APA':
          citationText = `${authors} (${yearDisplay}). ${title}. ${journal}.`;
          break;
        case 'MLA':
          citationText = `${authors}. "${title}." ${journal}, ${yearDisplay}.`;
          break;
        case 'Chicago':
          citationText = `${authors}. "${title}." ${journal} (${yearDisplay}).`;
          break;
        case 'IEEE':
          citationText = `${authors}, "${title}," ${journal}, ${yearDisplay}.`;
          break;
        case 'Harvard':
          citationText = `${authors} ${yearDisplay}, '${title}', ${journal}.`;
          break;
        default:
          citationText = `${authors} (${yearDisplay}). ${title}. ${journal}.`;
      }

      return {
        id: `crossref_${work.DOI || index}`,
        title,
        authors,
        year,
        journal,
        doi,
        url,
        abstract: work.abstract || 'No abstract available.',
        citationText,
        relevance: Math.floor(Math.random() * 3) + 3, // Crossref results are generally relevant
        type: 'journal',
        source: 'Crossref'
      };
    });

    return { citations, totalResults };
  } catch (error) {
    console.error('Crossref API error:', error);
    throw error;
  }
}
