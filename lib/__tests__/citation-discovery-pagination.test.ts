import { describe, it, expect } from 'vitest';
import {
  getCrossrefOffset,
  hasMoreResults,
} from '@/lib/citation-discovery-pagination';

describe('citation-discovery-pagination', () => {
  describe('getCrossrefOffset', () => {
    const limit = 8;
    const requestedRows = 30;

    it('returns 0 for first page (frontend offset 0)', () => {
      expect(getCrossrefOffset(0, limit, requestedRows)).toBe(0);
    });

    it('returns requestedRows for second page (frontend offset = limit)', () => {
      expect(getCrossrefOffset(8, limit, requestedRows)).toBe(30);
    });

    it('returns 2 * requestedRows for third page (frontend offset = 2 * limit)', () => {
      expect(getCrossrefOffset(16, limit, requestedRows)).toBe(60);
    });

    it('returns 3 * requestedRows for fourth page', () => {
      expect(getCrossrefOffset(24, limit, requestedRows)).toBe(90);
    });

    it('uses page index from floor(offset/limit)', () => {
      // offset 7 with limit 8 → page 0
      expect(getCrossrefOffset(7, limit, requestedRows)).toBe(0);
      // offset 9 with limit 8 → page 1
      expect(getCrossrefOffset(9, limit, requestedRows)).toBe(30);
    });

    it('handles different limit and requestedRows', () => {
      // limit 5, requestedRows 15: page 0 → 0, page 1 → 15, page 2 → 30
      expect(getCrossrefOffset(0, 5, 15)).toBe(0);
      expect(getCrossrefOffset(5, 5, 15)).toBe(15);
      expect(getCrossrefOffset(10, 5, 15)).toBe(30);
    });

    it('returns 0 when limit is 0 (avoids division)', () => {
      expect(getCrossrefOffset(8, 0, 30)).toBe(0);
    });

    it('caps offset at Crossref maximum (10000)', () => {
      // Page index 334 with requestedRows 30 → 10020, capped to 10000
      expect(getCrossrefOffset(2672, 8, 30)).toBe(10_000);
      // Page index 333 → 9990, not capped
      expect(getCrossrefOffset(2666, 8, 30)).toBe(9990);
      expect(getCrossrefOffset(2667, 8, 30)).toBe(9990);
    });
  });

  describe('hasMoreResults', () => {
    it('returns true when more results exist', () => {
      expect(hasMoreResults(0, 30, 100)).toBe(true);
      expect(hasMoreResults(30, 30, 100)).toBe(true);
      expect(hasMoreResults(60, 30, 100)).toBe(true);
    });

    it('returns false when at or past end', () => {
      expect(hasMoreResults(70, 30, 100)).toBe(false);
      expect(hasMoreResults(90, 30, 100)).toBe(false);
      expect(hasMoreResults(0, 30, 30)).toBe(false);
      expect(hasMoreResults(0, 30, 25)).toBe(false);
    });

    it('returns false when totalResults is invalid', () => {
      expect(hasMoreResults(0, 30, 0)).toBe(false);
      expect(hasMoreResults(0, 30, -1)).toBe(false);
      expect(hasMoreResults(0, 30, NaN)).toBe(false);
      expect(hasMoreResults(0, 30, undefined as unknown as number)).toBe(false);
    });
  });
});
