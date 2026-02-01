import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scheduleScrollEditorIntoView } from '@/lib/scroll-editor-into-view';

describe('scroll-editor-into-view', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('scheduleScrollEditorIntoView', () => {
    it('calls scrollIntoView on ref.current after the delay with smooth and nearest', () => {
      const scrollIntoView = vi.fn();
      const ref = { current: { scrollIntoView } as unknown as HTMLDivElement };

      scheduleScrollEditorIntoView(ref);

      expect(scrollIntoView).not.toHaveBeenCalled();
      vi.advanceTimersByTime(150);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
      });
    });

    it('uses custom delay when provided', () => {
      const scrollIntoView = vi.fn();
      const ref = { current: { scrollIntoView } as unknown as HTMLDivElement };

      scheduleScrollEditorIntoView(ref, 200);

      vi.advanceTimersByTime(199);
      expect(scrollIntoView).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it('does not throw when ref.current is null', () => {
      const ref = { current: null };

      expect(() => scheduleScrollEditorIntoView(ref)).not.toThrow();
      vi.advanceTimersByTime(200);
    });

    it('does not call scrollIntoView when ref.current is null', () => {
      const ref = { current: null };

      scheduleScrollEditorIntoView(ref);
      vi.advanceTimersByTime(200);

      // No element to call scrollIntoView on; nothing to assert except no throw
      expect(ref.current).toBeNull();
    });

    it('calls scrollIntoView on ref.current when ref is set after schedule (e.g. after React commit)', () => {
      const scrollIntoView = vi.fn();
      const ref = { current: null as HTMLDivElement | null };

      scheduleScrollEditorIntoView(ref);
      expect(scrollIntoView).not.toHaveBeenCalled();

      // Simulate React attaching the ref before the delay expires (production: modal close + state updates then commit)
      ref.current = { scrollIntoView } as unknown as HTMLDivElement;

      vi.advanceTimersByTime(150);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'nearest',
      });
    });

    it('does not call scrollIntoView when ref is still null when timer fires', () => {
      const ref = { current: null as HTMLDivElement | null };

      scheduleScrollEditorIntoView(ref);
      vi.advanceTimersByTime(150);

      // ref stayed null (e.g. editor section unmounted) - no throw, no call
      expect(ref.current).toBeNull();
    });
  });
});
