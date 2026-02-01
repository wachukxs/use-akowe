/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CITATION_HIGHLIGHT_ATTR,
  CITATION_HIGHLIGHT_CLASS,
  escapeHtmlForCitation,
  scheduleCitationHighlightRemoval,
  wrapCitationInHighlight,
} from '@/lib/citation-highlight';

describe('citation-highlight', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('escapeHtmlForCitation', () => {
    it('escapes & < > " for safe use in HTML', () => {
      expect(escapeHtmlForCitation('(Smith & Co, 2023)')).toBe('(Smith &amp; Co, 2023)');
      expect(escapeHtmlForCitation('a<b>c')).toBe('a&lt;b&gt;c');
      expect(escapeHtmlForCitation('"quote"')).toBe('&quot;quote&quot;');
    });

    it('leaves normal citation text unchanged', () => {
      expect(escapeHtmlForCitation('(Smith, 2023)')).toBe('(Smith, 2023)');
    });
  });

  describe('wrapCitationInHighlight', () => {
    it('wraps the last occurrence of citation text in a highlight span', () => {
      const editor = document.createElement('div');
      const textNode = document.createTextNode('First (Old, 2020). Second (Smith, 2023).');
      editor.appendChild(textNode);
      document.body.appendChild(editor);

      const wrapped = wrapCitationInHighlight(editor, '(Smith, 2023)');

      expect(wrapped).toBe(true);
      const span = editor.querySelector(`[${CITATION_HIGHLIGHT_ATTR}]`);
      expect(span).not.toBeNull();
      expect(span?.className).toBe(CITATION_HIGHLIGHT_CLASS);
      expect(span?.textContent).toBe('(Smith, 2023)');
      document.body.removeChild(editor);
    });

    it('returns false when citation text is not found', () => {
      const editor = document.createElement('div');
      editor.innerHTML = '<p>No citation here.</p>';
      document.body.appendChild(editor);

      const wrapped = wrapCitationInHighlight(editor, '(Missing, 2023)');

      expect(wrapped).toBe(false);
      expect(editor.querySelector(`[${CITATION_HIGHLIGHT_ATTR}]`)).toBeNull();
      document.body.removeChild(editor);
    });

    it('returns false when editor is null', () => {
      expect(wrapCitationInHighlight(null, '(Smith, 2023)')).toBe(false);
    });
  });

  describe('scheduleCitationHighlightRemoval', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('unwraps highlight spans after the duration', () => {
      const editor = document.createElement('div');
      editor.innerHTML = `<p>Text <span class="${CITATION_HIGHLIGHT_CLASS}" ${CITATION_HIGHLIGHT_ATTR}="true">(Smith, 2023)</span> end.</p>`;
      document.body.appendChild(editor);

      scheduleCitationHighlightRemoval(editor, 2000);
      expect(editor.querySelector(`[${CITATION_HIGHLIGHT_ATTR}]`)).not.toBeNull();

      vi.advanceTimersByTime(2000);
      expect(editor.querySelector(`[${CITATION_HIGHLIGHT_ATTR}]`)).toBeNull();
      expect(editor.textContent).toContain('(Smith, 2023)');
      document.body.removeChild(editor);
    });

    it('does nothing when editor is null', () => {
      expect(() => scheduleCitationHighlightRemoval(null, 100)).not.toThrow();
      vi.advanceTimersByTime(100);
    });
  });
});
