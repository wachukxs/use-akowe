import { describe, it, expect } from 'vitest';
import {
  SEARCH_TOPIC_REQUIRED_TOOLTIP,
  CONTEXT_MENU_FIND_CITATION_LABEL,
} from '@/lib/find-citation-constants';

describe('find-citation-constants', () => {
  describe('CONTEXT_MENU_FIND_CITATION_LABEL', () => {
    it('is the label for the floating Find citation control on editor right-click', () => {
      expect(CONTEXT_MENU_FIND_CITATION_LABEL).toBe('Find citation');
    });
  });

  describe('SEARCH_TOPIC_REQUIRED_TOOLTIP', () => {
    it('tells the user a search topic is required', () => {
      expect(SEARCH_TOPIC_REQUIRED_TOOLTIP).toBe(
        'Enter a search topic to find citations.'
      );
    });

    it('is non-empty and suitable for tooltip', () => {
      expect(SEARCH_TOPIC_REQUIRED_TOOLTIP.length).toBeGreaterThan(0);
      expect(SEARCH_TOPIC_REQUIRED_TOOLTIP.trim()).toBe(
        SEARCH_TOPIC_REQUIRED_TOOLTIP
      );
    });
  });
});
