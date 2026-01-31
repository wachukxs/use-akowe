/**
 * Pagination helpers for citation discovery (Crossref API).
 * Maps frontend page offset/limit to Crossref's offset for "load more" requests.
 */

const CROSSREF_OFFSET_MAX = 10_000;

/**
 * Computes the Crossref API offset for a given frontend page.
 * Each frontend "page" requests a distinct batch from Crossref (no overlap).
 *
 * @param frontendOffset - Number of citations already shown (0, limit, 2*limit, ...)
 * @param limit - Page size returned to the client (e.g. 8)
 * @param requestedRows - Number of rows requested from Crossref per page (e.g. 30)
 * @returns Crossref offset (capped at CROSSREF_OFFSET_MAX)
 */
export function getCrossrefOffset(
  frontendOffset: number,
  limit: number,
  requestedRows: number
): number {
  if (limit <= 0) return 0;
  const pageIndex = Math.floor(frontendOffset / limit);
  const offset = pageIndex * requestedRows;
  return Math.min(offset, CROSSREF_OFFSET_MAX);
}

/**
 * Whether Crossref has more results after the current page.
 *
 * @param crossrefOffset - Offset used for the current request
 * @param countReturned - Number of items returned in this batch
 * @param totalResults - Total result count from Crossref (message['total-results'])
 */
export function hasMoreResults(
  crossrefOffset: number,
  countReturned: number,
  totalResults: number
): boolean {
  if (typeof totalResults !== 'number' || totalResults <= 0) return false;
  return crossrefOffset + countReturned < totalResults;
}
