/**
 * Citation highlight: wrap newly added citation text in a temporary highlight span,
 * then unwrap after a delay so the user sees where the citation was added.
 */

export const CITATION_HIGHLIGHT_CLASS = 'citation-just-added';
export const CITATION_HIGHLIGHT_ATTR = 'data-citation-highlight';

/**
 * Escapes HTML special characters so citation text can be safely used in innerHTML.
 */
export function escapeHtmlForCitation(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const DEFAULT_HIGHLIGHT_DURATION_MS = 5000;

/**
 * Finds the range that spans the given citation text inside the editor.
 * Prefers the last occurrence (e.g. for integrate path where we just appended or AI placed it).
 * Returns null if the text is not found.
 */
function findCitationTextRange(editor: HTMLElement, citationText: string): Range | null {
  if (!citationText || typeof citationText !== 'string') return null;
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null);
  let fullText = '';
  const nodes: { node: Text; start: number; end: number }[] = [];
  let currentStart = 0;
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const len = node.textContent?.length ?? 0;
    nodes.push({ node, start: currentStart, end: currentStart + len });
    fullText += node.textContent ?? '';
    currentStart += len;
  }
  const index = fullText.lastIndexOf(citationText);
  if (index === -1) return null;
  const endIndex = index + citationText.length;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  for (const { node, start, end } of nodes) {
    if (start <= index && index < end) {
      startNode = node;
      startOffset = index - start;
    }
    if (start < endIndex && endIndex <= end) {
      endNode = node;
      endOffset = endIndex - start;
    }
    if (startNode && endNode) break;
  }
  if (!startNode || !endNode) return null;
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

/**
 * Wraps the given citation text in the editor in a highlight span.
 * Finds the citation (last occurrence) and wraps it. Returns true if wrapped.
 */
export function wrapCitationInHighlight(editor: HTMLElement | null, citationText: string): boolean {
  if (!editor || !editor.isConnected) return false;
  const range = findCitationTextRange(editor, citationText);
  if (!range) return false;
  try {
    const span = document.createElement('span');
    span.className = CITATION_HIGHLIGHT_CLASS;
    span.setAttribute(CITATION_HIGHLIGHT_ATTR, 'true');
    const fragment = range.extractContents();
    range.insertNode(span);
    span.appendChild(fragment);
    return true;
  } catch {
    return false;
  }
}

/**
 * Unwraps all citation highlight spans inside the editor (replaces span with its children).
 */
function removeCitationHighlights(editor: HTMLElement): void {
  const highlights = editor.querySelectorAll(`[${CITATION_HIGHLIGHT_ATTR}]`);
  highlights.forEach((el) => {
    if (el.parentNode && el instanceof HTMLElement) {
      while (el.firstChild) {
        el.parentNode.insertBefore(el.firstChild, el);
      }
      el.parentNode.removeChild(el);
    }
  });
}

/**
 * Schedules removal of citation highlights inside the editor after the given duration.
 * After the duration, all elements with the highlight attribute are unwrapped.
 */
export function scheduleCitationHighlightRemoval(
  editor: HTMLElement | null,
  durationMs: number = DEFAULT_HIGHLIGHT_DURATION_MS
): void {
  if (!editor || !editor.isConnected) return;
  const el = editor;
  setTimeout(() => {
    if (el.isConnected) removeCitationHighlights(el);
  }, durationMs);
}
