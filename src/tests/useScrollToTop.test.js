import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { scrollToTop, useScrollToTop } from '../utils/useScrollToTop';

describe('useScrollToTop utility', () => {
  it('calls window.scrollTo when scrollToTop is invoked', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => { });
    scrollToTop();
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
    scrollToSpy.mockRestore();
  });

  it('calls container scrollTo when container object is passed to scrollToTop', () => {
    const mockContainer = { scrollTo: vi.fn(), scrollTop: 500 };
    scrollToTop(mockContainer);
    expect(mockContainer.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
    expect(mockContainer.scrollTop).toBe(0);
  });

  it('resets scroll on trigger change via hook', () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => { });
    let trigger = 'page1';

    const { rerender } = renderHook(() => useScrollToTop(trigger));
    expect(scrollToSpy).toHaveBeenCalledTimes(1);

    trigger = 'page2';
    rerender();
    expect(scrollToSpy).toHaveBeenCalledTimes(2);

    scrollToSpy.mockRestore();
  });
});
