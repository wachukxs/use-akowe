import {
  extractPublicationYearFromCrossref,
  formatYearForDisplay,
  formatYearForCitationKey,
} from '@/lib/citation-year';

export interface CitationData {
  doi?: string;
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  publisher?: string;
  url?: string;
}

// Search OpenAlex for academic papers
export async function searchOpenAlex(query: string): Promise<CitationData[]> {
  try {
    const email = process.env.OPENALEX_EMAIL || 'user@example.com';
    const response = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(query)}&mailto=${email}&per-page=10`
    );

    if (!response.ok) {
      throw new Error('OpenAlex search failed');
    }

    const data = await response.json();
    
    return data.results.map((work: any) => ({
      doi: work.doi?.replace('https://doi.org/', ''),
      title: work.title,
      authors: work.authorships?.map((a: any) => a.author.display_name) || [],
      year: work.publication_year,
      journal: work.primary_location?.source?.display_name,
      publisher: work.primary_location?.source?.host_organization_name,
      url: work.doi || work.id,
    }));
  } catch (error) {
    console.error('Error searching OpenAlex:', error);
    return [];
  }
}

// Get citation by DOI from Crossref
export async function getCitationByDOI(doi: string): Promise<CitationData | null> {
  try {
    const response = await fetch(`https://api.crossref.org/works/${doi}`);

    if (!response.ok) {
      throw new Error('Crossref lookup failed');
    }

    const data = await response.json();
    const work = data.message;

    return {
      doi: work.DOI,
      title: work.title?.[0] || '',
      authors: work.author?.map((a: any) => `${a.given} ${a.family}`) || [],
      year: extractPublicationYearFromCrossref(work),
      journal: work['container-title']?.[0],
      publisher: work.publisher,
      url: `https://doi.org/${work.DOI}`,
    };
  } catch (error) {
    console.error('Error fetching from Crossref:', error);
    return null;
  }
}

// Format citation in APA style (uses "n.d." when year is unknown)
export function formatCitationAPA(citation: CitationData): string {
  const authors = citation.authors.slice(0, 3).join(', ') + (citation.authors.length > 3 ? ', et al.' : '');
  const yearDisplay = formatYearForDisplay(citation.year);
  const title = citation.title;
  const journal = citation.journal ? `${citation.journal}. ` : '';
  const doi = citation.doi ? `https://doi.org/${citation.doi}` : citation.url;

  return `${authors} (${yearDisplay}). ${title}. ${journal}${doi}`;
}

// Generate citation key (e.g. Smith2023 or Smithn.d. when year unknown)
export function generateCitationKey(citation: CitationData): string {
  const firstAuthor = citation.authors[0]?.split(' ').pop() || 'Unknown';
  const yearPart = formatYearForCitationKey(citation.year);
  return `${firstAuthor}${yearPart}`;
}

