import { describe, it, expect } from 'vitest';
import {
  getTopicTokens,
  calculateTopicRelevanceScore,
  isTopicRelevant,
  type CitationLike,
} from '@/lib/citation-relevance';

describe('citation-relevance', () => {
  describe('getTopicTokens', () => {
    it('extracts significant tokens from a topic', () => {
      expect(getTopicTokens('comparative maritime law')).toEqual([
        'comparative',
        'maritime',
        'law',
      ]);
    });

    it('normalises to lowercase and deduplicates', () => {
      const tokens = getTopicTokens('Maritime Law MARITIME');
      expect(tokens).toContain('maritime');
      expect(tokens).toContain('law');
      expect(tokens.filter((t) => t === 'maritime')).toHaveLength(1);
    });

    it('removes stop words', () => {
      const tokens = getTopicTokens('the role of and in maritime law');
      expect(tokens).not.toContain('the');
      expect(tokens).not.toContain('of');
      expect(tokens).not.toContain('and');
      expect(tokens).not.toContain('in');
      expect(tokens).toContain('role');
      expect(tokens).toContain('maritime');
      expect(tokens).toContain('law');
    });

    it('removes very short tokens', () => {
      const tokens = getTopicTokens('a b maritime law');
      expect(tokens).not.toContain('a');
      expect(tokens).not.toContain('b');
      expect(tokens).toContain('maritime');
      expect(tokens).toContain('law');
    });

    it('returns empty array for empty or invalid input', () => {
      expect(getTopicTokens('')).toEqual([]);
      expect(getTopicTokens('   ')).toEqual([]);
      expect(getTopicTokens('the and of')).toEqual([]);
    });

    it('handles single significant word', () => {
      expect(getTopicTokens('maritime')).toEqual(['maritime']);
    });
  });

  describe('calculateTopicRelevanceScore', () => {
    it('returns 0 for empty topic', () => {
      const citation: CitationLike = {
        title: 'Maritime Law and Shipping',
        abstract: 'A study of maritime law.',
      };
      expect(calculateTopicRelevanceScore(citation, '')).toBe(0);
      expect(calculateTopicRelevanceScore(citation, '   ')).toBe(0);
    });

    it('returns 0 for citation with no title or abstract', () => {
      expect(calculateTopicRelevanceScore({}, 'maritime law')).toBe(0);
      expect(calculateTopicRelevanceScore({ title: '', abstract: '' }, 'maritime law')).toBe(0);
    });

    it('scores higher when topic tokens appear in title', () => {
      const maritimeInTitle: CitationLike = {
        title: 'Comparative maritime law in the EU',
        abstract: 'Healthcare and medicine.',
      };
      const maritimeInAbstractOnly: CitationLike = {
        title: 'Comparative healthcare systems',
        abstract: 'This paper discusses maritime law briefly.',
      };
      const scoreTitle = calculateTopicRelevanceScore(maritimeInTitle, 'comparative maritime law');
      const scoreAbstractOnly = calculateTopicRelevanceScore(
        maritimeInAbstractOnly,
        'comparative maritime law'
      );
      expect(scoreTitle).toBeGreaterThan(scoreAbstractOnly);
    });

    it('scores citation about maritime law higher than one about healthcare for topic "comparative maritime law"', () => {
      const maritimeCitation: CitationLike = {
        title: 'Comparative maritime law and ship arrest',
        abstract: 'A study of maritime law and comparative approaches.',
      };
      const healthcareCitation: CitationLike = {
        title: 'Comparative healthcare systems in Europe',
        abstract: 'A study of comparative health policy.',
      };
      const maritimeScore = calculateTopicRelevanceScore(maritimeCitation, 'comparative maritime law');
      const healthcareScore = calculateTopicRelevanceScore(
        healthcareCitation,
        'comparative maritime law'
      );
      expect(maritimeScore).toBeGreaterThan(healthcareScore);
    });

    it('gives zero score when no topic tokens appear in citation', () => {
      const citation: CitationLike = {
        title: 'Healthcare Policy in the EU',
        abstract: 'Medicine and health systems.',
      };
      expect(calculateTopicRelevanceScore(citation, 'comparative maritime law')).toBe(0);
    });

    it('caps score at 100', () => {
      const citation: CitationLike = {
        title: 'Maritime law maritime law maritime law comparative law',
        abstract: 'Maritime law maritime law maritime law comparative law',
      };
      expect(calculateTopicRelevanceScore(citation, 'comparative maritime law')).toBeLessThanOrEqual(
        100
      );
    });
  });

  describe('isTopicRelevant', () => {
    it('returns true when score is at or above minimum', () => {
      const citation: CitationLike = {
        title: 'Maritime law and shipping',
        abstract: 'Discussion of maritime law.',
      };
      expect(isTopicRelevant(citation, 'maritime law', 5)).toBe(true);
      expect(isTopicRelevant(citation, 'maritime law', 0)).toBe(true);
    });

    it('returns false when score is below minimum', () => {
      const citation: CitationLike = {
        title: 'Healthcare systems in Europe',
        abstract: 'Comparative health policy.',
      };
      expect(isTopicRelevant(citation, 'comparative maritime law', 10)).toBe(false);
    });

    it('uses MIN_TOPIC_RELEVANCE_SCORE when minScore not provided', () => {
      const citation: CitationLike = { title: 'Maritime law', abstract: '' };
      expect(isTopicRelevant(citation, 'maritime law')).toBe(true);
    });
  });
});
