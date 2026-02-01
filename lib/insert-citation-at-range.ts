import { CITATION_HIGHLIGHT_ATTR, CITATION_HIGHLIGHT_CLASS } from './citation-highlight';

/**
 * Inserts citation text at a given range in a contenteditable element.
 * Used when the user added a citation from the editor right-click flow (insert-at-position).
 * Mutates the DOM and dispatches an input event so React state can sync.
 * No-op if the range is not inside the editor (defensive guard).
 * When wrapInHighlight is true, the inserted text is wrapped in a span for temporary highlight.
 */
export function insertCitationAtRange(
  editor: HTMLElement,
  range: Range,
  citationText: string,
  wrapInHighlight: boolean = false
): void {
  if (!editor.contains(range.startContainer)) return;
  const text = ` ${citationText.trim()} `;
  range.deleteContents();
  if (wrapInHighlight) {
    const span = document.createElement('span');
    span.className = CITATION_HIGHLIGHT_CLASS;
    span.setAttribute(CITATION_HIGHLIGHT_ATTR, 'true');
    span.textContent = text;
    range.insertNode(span);
    range.setStartAfter(span);
    range.setEndAfter(span);
  } else {
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
  }
  const inputEvent = new Event('input', { bubbles: true });
  editor.dispatchEvent(inputEvent);
}
