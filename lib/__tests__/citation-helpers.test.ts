import { describe, it, expect } from 'vitest';
import {
  normalizeCitationForProject,
  isCitationInList,
  getCitationsWithAdded,
} from '@/lib/citation-helpers';
import type { Citation } from '@/types';

describe('citation-helpers', () => {
  describe('normalizeCitationForProject', () => {
    it('normalizes discover citation with authors array', () => {
      const input = {
        id: 'disco_1',
        title: 'Some Paper',
        authors: ['Smith J', 'Doe A'],
        year: 2023,
        citationKey: 'cite_smith2023',
        citationText: '(Smith & Doe, 2023)',
        addedAt: new Date('2024-01-01'),
        source: 'discovered' as const,
      };
      const out = normalizeCitationForProject(input);
      expect(out.id).toBe('disco_1');
      expect(out.title).toBe('Some Paper');
      expect(out.authors).toEqual(['Smith J', 'Doe A']);
      expect(out.year).toBe(2023);
      expect(out.citationKey).toBe('cite_smith2023');
      expect(out.citationText).toBe('(Smith & Doe, 2023)');
      expect(out.source).toBe('discovered');
    });

    it('normalizes citation with authors as string', () => {
      const input = {
        title: 'Single Author',
        authors: 'Smith J',
        year: 2022,
      };
      const out = normalizeCitationForProject(input);
      expect(out.authors).toEqual(['Smith J']);
      expect(out.title).toBe('Single Author');
      expect(out.year).toBe(2022);
      expect(out.id).toBeDefined();
      expect(out.citationKey).toBeDefined();
      expect(out.citationText).toContain('Smith J');
      expect(out.source).toBe('discovered');
    });

    it('handles missing optional fields with defaults', () => {
      const input = { authors: ['Unknown'], year: 2020 };
      const out = normalizeCitationForProject(input);
      expect(out.title).toContain('Unknown');
      expect(out.citationText).toContain('Unknown');
      expect(out.addedAt).toBeInstanceOf(Date);
    });
  });

  describe('isCitationInList', () => {
    const list: Citation[] = [
      {
        id: '1',
        citationKey: 'c1',
        title: 'First',
        authors: ['Smith J'],
        year: 2023,
        citationText: '(Smith, 2023)',
        addedAt: new Date(),
      },
      {
        id: '2',
        citationKey: 'c2',
        title: 'Second',
        authors: ['Doe A', 'Doe B'],
        year: 2022,
        citationText: '(Doe et al., 2022)',
        addedAt: new Date(),
      },
    ];

    it('returns true when author+year match (same author string)', () => {
      expect(isCitationInList({ authors: ['Smith J'], year: 2023 }, list)).toBe(
        true
      );
    });

    it('returns true when author matches case-insensitively', () => {
      expect(isCitationInList({ authors: ['smith j'], year: 2023 }, list)).toBe(
        true
      );
    });

    it('returns true when one author overlaps (includes)', () => {
      expect(isCitationInList({ authors: ['Doe A'], year: 2022 }, list)).toBe(
        true
      );
    });

    it('returns false when year differs', () => {
      expect(isCitationInList({ authors: ['Smith J'], year: 2022 }, list)).toBe(
        false
      );
    });

    it('returns false when author differs', () => {
      expect(
        isCitationInList({ authors: ['Other K'], year: 2023 }, list)
      ).toBe(false);
    });

    it('returns false for empty list', () => {
      expect(
        isCitationInList({ authors: ['Smith J'], year: 2023 }, [])
      ).toBe(false);
    });
  });

  describe('getCitationsWithAdded', () => {
    const existing: Citation[] = [
      {
        id: '1',
        citationKey: 'c1',
        title: 'First',
        authors: ['Smith J'],
        year: 2023,
        citationText: '(Smith, 2023)',
        addedAt: new Date(),
      },
    ];

    it('appends new citation when not in list', () => {
      const added: Citation = {
        id: '2',
        citationKey: 'c2',
        title: 'Second',
        authors: ['Doe A'],
        year: 2022,
        citationText: '(Doe, 2022)',
        addedAt: new Date(),
      };
      const result = getCitationsWithAdded(existing, added);
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(added);
    });

    it('returns same array when citation already in list (author+year)', () => {
      const duplicate: Citation = {
        id: 'other',
        citationKey: 'other',
        title: 'Same Author Year',
        authors: ['Smith J'],
        year: 2023,
        citationText: '(Smith, 2023)',
        addedAt: new Date(),
      };
      const result = getCitationsWithAdded(existing, duplicate);
      expect(result).toBe(existing);
      expect(result).toHaveLength(1);
    });

    it('returns new array with one item when existing is empty', () => {
      const added: Citation = {
        id: '1',
        citationKey: 'c1',
        title: 'Only',
        authors: ['Only A'],
        year: 2021,
        citationText: '(Only, 2021)',
        addedAt: new Date(),
      };
      const result = getCitationsWithAdded([], added);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(added);
    });
  });
});
