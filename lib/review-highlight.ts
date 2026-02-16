import { TextAnchor } from '@/types';

/**
 * Attempt to re-anchor a comment's text selection in potentially-edited content.
 * Uses 3-fallback strategy:
 * 1. Exact match at stored offsets
 * 2. Prefix + selectedText + suffix context search
 * 3. Plain selectedText search
 */
export function findAnchorInText(
  plainText: string,
  anchor: TextAnchor
): { start: number; end: number } | null {
  // Strategy 1: exact match at stored offset
  if (anchor.startOffset >= 0 && anchor.endOffset <= plainText.length) {
    const candidate = plainText.slice(anchor.startOffset, anchor.endOffset);
    if (candidate === anchor.selectedText) {
      return { start: anchor.startOffset, end: anchor.endOffset };
    }
  }

  // Strategy 2: prefix + selectedText + suffix context search
  if (anchor.prefix || anchor.suffix) {
    const searchPattern = anchor.prefix + anchor.selectedText + anchor.suffix;
    const idx = plainText.indexOf(searchPattern);
    if (idx !== -1) {
      const start = idx + anchor.prefix.length;
      return { start, end: start + anchor.selectedText.length };
    }
  }

  // Strategy 3: plain text search
  const simpleIdx = plainText.indexOf(anchor.selectedText);
  if (simpleIdx !== -1) {
    return { start: simpleIdx, end: simpleIdx + anchor.selectedText.length };
  }

  // Cannot re-anchor
  return null;
}
