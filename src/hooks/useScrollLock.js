import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a modal is open.
 * @param {boolean} isLocked - Whether the scroll should be locked.
 */
export const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    if (isLocked) {
      document.body.style.overflow = 'hidden';
      // Optional: Add padding to prevent layout shift if scrollbar disappears
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0px';
    }

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = '0px';
    };
  }, [isLocked]);
};
