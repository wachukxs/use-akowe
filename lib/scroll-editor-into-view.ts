/**
 * Schedules scrolling the editor section into view after a short delay.
 * Used after adding a citation so the user sees where the content was updated.
 * Delay allows the modal to close and layout to settle before scrolling.
 */
export const DEFAULT_DELAY_MS = 500;

const SCROLL_OPTIONS: ScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'nearest',
};

export type EditorSectionRef = { current: HTMLDivElement | null };

export function scheduleScrollEditorIntoView(
  ref: EditorSectionRef,
  delayMs: number = DEFAULT_DELAY_MS
): void {
  setTimeout(() => {
    ref.current?.scrollIntoView(SCROLL_OPTIONS);
  }, delayMs);
}
