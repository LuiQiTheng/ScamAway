import { useEffect } from 'react';

/**
 * Resets scroll position to top (0, 0)
 * @param {HTMLElement|null} target - Optional scroll container element; defaults to window/document
 */
export const scrollToTop = (target = null) => {
  if (target && typeof target.scrollTo === 'function') {
    target.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    target.scrollTop = 0;
  } else if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }
};

/**
 * React hook to automatically scroll to top when a trigger changes
 * @param {any} trigger - Dependency value that triggers scroll reset when changed
 * @param {React.RefObject|null} containerRef - Optional ref to a scrollable container
 */
export const useScrollToTop = (trigger, containerRef = null) => {
  useEffect(() => {
    if (containerRef && containerRef.current) {
      scrollToTop(containerRef.current);
    } else {
      scrollToTop();
    }
  }, [trigger, containerRef]);
};
