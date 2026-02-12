/**
 * Helpers for the editor "Find citation" context menu / long-press pill.
 */

const PILL_OFFSET = 8;
const PILL_EST_WIDTH = 200;
const PILL_EST_HEIGHT = 48;

/**
 * Returns a collapsed Range at the given viewport coordinates, or null.
 * Uses caretRangeFromPoint (WebKit) or caretPositionFromPoint (standard).
 */
export function getRangeAtPoint(clientX: number, clientY: number): Range | null {
  if (typeof document === 'undefined') return null;
  const doc = document;
  if (typeof (doc as unknown as { caretRangeFromPoint?(x: number, y: number): Range }).caretRangeFromPoint === 'function') {
    return (doc as unknown as { caretRangeFromPoint(x: number, y: number): Range }).caretRangeFromPoint(clientX, clientY);
  }
  const pos = (doc as unknown as { caretPositionFromPoint?(x: number, y: number): { offsetNode: Node; offset: number } | null }).caretPositionFromPoint?.(clientX, clientY);
  if (!pos) return null;
  const r = doc.createRange();
  r.setStart(pos.offsetNode, pos.offset);
  r.collapse(true);
  return r;
}

/**
 * Returns viewport-safe { x, y } for the Find citation pill so it stays on screen.
 */
export function viewportSafePillPosition(clientX: number, clientY: number): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: clientX, y: clientY + PILL_OFFSET };
  let x = clientX;
  let y = clientY + PILL_OFFSET;
  if (x + PILL_EST_WIDTH > window.innerWidth) x = Math.max(0, window.innerWidth - PILL_EST_WIDTH);
  if (x < 0) x = 0;
  if (y + PILL_EST_HEIGHT > window.innerHeight) y = Math.max(PILL_OFFSET, clientY - PILL_EST_HEIGHT - PILL_OFFSET);
  if (y < 0) y = PILL_OFFSET;
  return { x, y };
}

const REWRITE_PANEL_OFFSET = 8;
const REWRITE_PANEL_EST_WIDTH = 320;
const REWRITE_PANEL_EST_HEIGHT = 350;

/**
 * Returns viewport-safe { x, y } for the Rewrite panel so it stays on screen.
 */
export function viewportSafeRewritePanelPosition(clientX: number, clientY: number): { x: number; y: number } {
  if (typeof window === 'undefined') return { x: clientX, y: clientY + REWRITE_PANEL_OFFSET };
  let x = clientX;
  let y = clientY + REWRITE_PANEL_OFFSET;
  if (x + REWRITE_PANEL_EST_WIDTH > window.innerWidth) x = Math.max(0, window.innerWidth - REWRITE_PANEL_EST_WIDTH);
  if (x < 0) x = 0;
  if (y + REWRITE_PANEL_EST_HEIGHT > window.innerHeight) y = Math.max(REWRITE_PANEL_OFFSET, clientY - REWRITE_PANEL_EST_HEIGHT - REWRITE_PANEL_OFFSET);
  if (y < 0) y = REWRITE_PANEL_OFFSET;
  return { x, y };
}
