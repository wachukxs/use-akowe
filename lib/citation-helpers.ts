import { Citation } from '@/types';
import { formatYearForDisplay, formatYearForCitationKey } from '@/lib/citation-year';

/**
 * Normalize a discover/modal citation shape to project Citation.
 * Handles authors as string or string[] and ensures required fields.
 */
export function normalizeCitationForProject(
  citation: Record<string, unknown>
): Citation {
  const authors = Array.isArray(citation.authors)
    ? (citation.authors as string[]).map(String)
    : typeof citation.authors === 'string'
      ? [citation.authors]
      : ['Unknown Author'];
  const year =
    typeof citation.year === 'number' && Number.isInteger(citation.year)
      ? citation.year
      : undefined;
  const yearForKey = year ?? formatYearForCitationKey(undefined);
  const firstAuthor = authors[0] ?? 'Unknown';
  const citationKey =
    typeof citation.citationKey === 'string' && citation.citationKey
      ? citation.citationKey
      : `cite_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const id =
    typeof citation.id === 'string' && citation.id
      ? citation.id
      : `discovered_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const title = typeof citation.title === 'string' ? citation.title : `Research by ${firstAuthor} (${formatYearForDisplay(year)})`;
  const citationText =
    typeof citation.citationText === 'string' && citation.citationText
      ? citation.citationText
      : `(${authors.join(', ')}, ${formatYearForDisplay(year)})`;
  const addedAt =
    citation.addedAt instanceof Date
      ? citation.addedAt
      : new Date();
  const source = (citation.source as Citation['source']) ?? 'discovered';

  return {
    id,
    citationKey,
    title,
    authors,
    year,
    citationText,
    addedAt,
    source,
    ...(typeof citation.doi === 'string' && { doi: citation.doi }),
    ...(typeof citation.journal === 'string' && { journal: citation.journal }),
    ...(typeof citation.publisher === 'string' && { publisher: citation.publisher }),
    ...(typeof citation.url === 'string' && { url: citation.url }),
  };
}

/**
 * Check if a citation is already in the list by author + year
 * (same logic as backend mergeCitations in lib/citation-parser.ts).
 */
export function isCitationInList(
  citation: { authors: string[]; year?: number },
  list: Citation[]
): boolean {
  const authA = citation.authors ?? [];
  const yearA = citation.year;
  return list.some(
    (existing) =>
      existing.authors.some((author) =>
        authA.some(
          (a) =>
            author.toLowerCase().includes(a.toLowerCase()) ||
            a.toLowerCase().includes(author.toLowerCase())
        )
      ) && existing.year === yearA
  );
}

/**
 * Return existing list with added citation appended only if not already present.
 * No duplicate by author+year.
 */
export function getCitationsWithAdded(
  existing: Citation[],
  added: Citation
): Citation[] {
  if (isCitationInList(added, existing)) return existing;
  return [...existing, added];
}
