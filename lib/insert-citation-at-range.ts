/**
 * Inserts citation text at a given range in a contenteditable element.
 * Used when the user added a citation from the editor right-click flow (insert-at-position).
 * Mutates the DOM and dispatches an input event so React state can sync.
 * No-op if the range is not inside the editor (defensive guard).
 */
export function insertCitationAtRange(
  editor: HTMLElement,
  range: Range,
  citationText: string
): void {
  if (!editor.contains(range.startContainer)) return;
  const text = ` ${citationText.trim()} `;
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  const inputEvent = new Event('input', { bubbles: true });
  editor.dispatchEvent(inputEvent);
}
