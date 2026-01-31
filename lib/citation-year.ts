/**
 * Citation year extraction and display utilities.
 * Ensures we never use current year as a fallback for unknown publication dates,
 * and use "n.d." (no date) for display when year is missing.
 */

/** Crossref work date-parts: [[year, month?, day?]] */
type DateParts = [number, number?, number?];

/** Minimal Crossref work shape for date extraction */
export interface CrossrefWorkLike {
  'published-print'?: { 'date-parts'?: DateParts[] };
  'published-online'?: { 'date-parts'?: DateParts[] };
  created?: { 'date-parts'?: DateParts[] };
  deposited?: { 'date-parts'?: DateParts[] };
}

/** Earliest plausible publication year (sanity check for bad metadata) */
const MIN_VALID_YEAR = 1000;

/**
 * Extracts the first element of the first date-parts array, if present.
 */
function getYearFromDateParts(parts: DateParts[] | undefined): number | undefined {
  const year = parts?.[0]?.[0];
  return typeof year === 'number' && Number.isInteger(year) ? year : undefined;
}

/**
 * Returns true if the year is plausible (not in the future, not before MIN_VALID_YEAR).
 */
function isValidPublicationYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return year >= MIN_VALID_YEAR && year <= currentYear;
}

/**
 * Extract publication year from a Crossref work object.
 * Uses only publication-related dates; never uses current year as fallback.
 *
 * Order of precedence:
 * 1. published-print (canonical publication date)
 * 2. published-online (online-first publication)
 * 3. created (record creation in Crossref – approximate)
 * 4. deposited (metadata deposit – approximate)
 *
 * Returns undefined if no valid date is found. Invalid years (e.g. future)
 * are treated as missing and return undefined.
 */
export function extractPublicationYearFromCrossref(work: CrossrefWorkLike): number | undefined {
  const candidates = [
    getYearFromDateParts(work['published-print']?.['date-parts']),
    getYearFromDateParts(work['published-online']?.['date-parts']),
    getYearFromDateParts(work.created?.['date-parts']),
    getYearFromDateParts(work.deposited?.['date-parts']),
  ];

  for (const year of candidates) {
    if (year !== undefined && isValidPublicationYear(year)) {
      return year;
    }
  }

  return undefined;
}

/** Display string for missing year (APA and common academic usage) */
export const NO_DATE_LABEL = 'n.d.';

/**
 * Format year for display in citations and UI.
 * Returns the year as a string, or "n.d." when year is missing.
 */
export function formatYearForDisplay(year: number | undefined | null): string {
  if (year === undefined || year === null) return NO_DATE_LABEL;
  if (!isValidPublicationYear(year)) return NO_DATE_LABEL;
  return String(year);
}

/**
 * Format year for use in citation keys (e.g. Smith2023, Smithn.d.).
 * Uses "n.d." when year is missing so keys remain stable and readable.
 */
export function formatYearForCitationKey(year: number | undefined | null): string {
  return formatYearForDisplay(year);
}
