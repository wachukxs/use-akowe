/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { insertCitationAtRange } from '@/lib/insert-citation-at-range';

describe('insert-citation-at-range', () => {
  describe('insertCitationAtRange', () => {
    it('inserts citation text at the range and trims spaces', () => {
      const editor = document.createElement('div');
      editor.innerHTML = '<p>Hello world</p>';
      editor.contentEditable = 'true';
      document.body.appendChild(editor);

      const p = editor.querySelector('p')!;
      const range = document.createRange();
      range.setStart(p.firstChild!, 5);
      range.setEnd(p.firstChild!, 5);

      insertCitationAtRange(editor, range, '  (Smith, 2023)  ');

      expect(editor.textContent).toContain('(Smith, 2023)');
      expect(editor.textContent).toBe('Hello (Smith, 2023)  world');
      document.body.removeChild(editor);
    });

    it('dispatches input event after insert', () => {
      const editor = document.createElement('div');
      editor.innerHTML = '<p>Text</p>';
      editor.contentEditable = 'true';
      document.body.appendChild(editor);

      let fired = false;
      editor.addEventListener('input', () => {
        fired = true;
      });

      const p = editor.querySelector('p')!;
      const range = document.createRange();
      range.setStart(p.firstChild!, 2);
      range.setEnd(p.firstChild!, 2);
      insertCitationAtRange(editor, range, '(Author, 2020)');

      expect(fired).toBe(true);
      document.body.removeChild(editor);
    });

    it('replaces selected content when range has length', () => {
      const editor = document.createElement('div');
      editor.innerHTML = '<p>Hello world</p>';
      editor.contentEditable = 'true';
      document.body.appendChild(editor);

      const p = editor.querySelector('p')!;
      const range = document.createRange();
      range.setStart(p.firstChild!, 0);
      range.setEnd(p.firstChild!, 5);

      insertCitationAtRange(editor, range, '(Doe, 2021)');

      expect(editor.textContent).toContain('(Doe, 2021)');
      expect(editor.textContent).toBe(' (Doe, 2021)  world');
      document.body.removeChild(editor);
    });

    it('does nothing when range is not inside the editor (defensive guard)', () => {
      const editor = document.createElement('div');
      editor.innerHTML = '<p>Original</p>';
      document.body.appendChild(editor);

      const other = document.createElement('div');
      other.innerHTML = '<p>Other</p>';
      document.body.appendChild(other);

      const range = document.createRange();
      const otherP = other.querySelector('p')!;
      range.setStart(otherP.firstChild!, 0);
      range.setEnd(otherP.firstChild!, 0);

      let fired = false;
      editor.addEventListener('input', () => {
        fired = true;
      });

      insertCitationAtRange(editor, range, '(Should not insert)');

      expect(editor.textContent).toBe('Original');
      expect(fired).toBe(false);
      document.body.removeChild(editor);
      document.body.removeChild(other);
    });
  });
});
