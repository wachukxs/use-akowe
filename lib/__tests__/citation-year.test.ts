import { describe, it, expect } from 'vitest';
import {
  extractPublicationYearFromCrossref,
  formatYearForDisplay,
  formatYearForCitationKey,
  NO_DATE_LABEL,
  type CrossrefWorkLike,
} from '@/lib/citation-year';

describe('citation-year', () => {
  const currentYear = new Date().getFullYear();

  describe('extractPublicationYearFromCrossref', () => {
    it('returns published-print year when present', () => {
      const work: CrossrefWorkLike = {
        'published-print': { 'date-parts': [[2015, 3, 15]] },
      };
      expect(extractPublicationYearFromCrossref(work)).toBe(2015);
    });

    it('returns published-online year when published-print is missing', () => {
      const work: CrossrefWorkLike = {
        'published-online': { 'date-parts': [[2018, 6]] },
      };
      expect(extractPublicationYearFromCrossref(work)).toBe(2018);
    });

    it('prefers published-print over published-online when both exist', () => {
      const work: CrossrefWorkLike = {
        'published-print': { 'date-parts': [[2015, 1]] },
        'published-online': { 'date-parts': [[2016, 1]] },
      };
      expect(extractPublicationYearFromCrossref(work)).toBe(2015);
    });

    it('uses created when publication dates are missing', () => {
      const work: CrossrefWorkLike = {
        created: { 'date-parts': [[2014, 5, 20]] },
      };
      expect(extractPublicationYearFromCrossref(work)).toBe(2014);
    });

    it('uses deposited when publication and created are missing', () => {
      const work: CrossrefWorkLike = {
        deposited: { 'date-parts': [[2013, 12, 1]] },
      };
      expect(extractPublicationYearFromCrossref(work)).toBe(2013);
    });

    it('returns undefined when no date fields exist (never current year)', () => {
      const work: CrossrefWorkLike = {};
      expect(extractPublicationYearFromCrossref(work)).toBeUndefined();
    });

    it('returns undefined when date-parts are empty or malformed', () => {
      expect(extractPublicationYearFromCrossref({ 'published-print': { 'date-parts': [] } })).toBeUndefined();
      expect(extractPublicationYearFromCrossref({ 'published-print': { 'date-parts': [[]] } })).toBeUndefined();
      expect(extractPublicationYearFromCrossref({ 'published-print': {} })).toBeUndefined();
    });

    it('returns undefined for future year (invalid metadata)', () => {
      const work: CrossrefWorkLike = {
        'published-print': { 'date-parts': [[currentYear + 5, 1, 1]] },
      };
      expect(extractPublicationYearFromCrossref(work)).toBeUndefined();
    });

    it('returns undefined for any future year (e.g. currentYear + 1)', () => {
      const work: CrossrefWorkLike = {
        'published-print': { 'date-parts': [[currentYear + 1, 1, 1]] },
      };
      expect(extractPublicationYearFromCrossref(work)).toBeUndefined();
    });

    it('returns year for valid past year (e.g. 2015)', () => {
      const work: CrossrefWorkLike = {
        'published-print': { 'date-parts': [[2015, 4, 10]] },
      };
      expect(extractPublicationYearFromCrossref(work)).toBe(2015);
    });

    it('returns undefined for year before MIN_VALID_YEAR (sanity check)', () => {
      const work: CrossrefWorkLike = {
        'published-print': { 'date-parts': [[500, 1, 1]] },
      };
      expect(extractPublicationYearFromCrossref(work)).toBeUndefined();
    });

    it('accepts year-only date-parts', () => {
      const work: CrossrefWorkLike = {
        'published-online': { 'date-parts': [[2000]] },
      };
      expect(extractPublicationYearFromCrossref(work)).toBe(2000);
    });
  });

  describe('formatYearForDisplay', () => {
    it('returns "n.d." for undefined', () => {
      expect(formatYearForDisplay(undefined)).toBe(NO_DATE_LABEL);
    });

    it('returns "n.d." for null', () => {
      expect(formatYearForDisplay(null)).toBe(NO_DATE_LABEL);
    });

    it('returns string year for valid number', () => {
      expect(formatYearForDisplay(2015)).toBe('2015');
    });

    it('returns "n.d." for future year', () => {
      expect(formatYearForDisplay(currentYear + 1)).toBe(NO_DATE_LABEL);
    });
  });

  describe('formatYearForCitationKey', () => {
    it('returns "n.d." when year is undefined', () => {
      expect(formatYearForCitationKey(undefined)).toBe(NO_DATE_LABEL);
    });

    it('returns string year when year is valid', () => {
      expect(formatYearForCitationKey(2020)).toBe('2020');
    });
  });
});
