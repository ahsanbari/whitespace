import { useState, useCallback } from 'react';

export const useLoadingState = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Trigger loading when settings change
  const triggerLoading = useCallback(() => {
    setIsLoading(true);
    // Auto-hide loading after a short delay
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  // Wrapped setters that trigger loading
  const withLoading = useCallback(<T extends any[]>(setter: (...args: T) => void) => {
    return (...args: T) => {
      triggerLoading();
      setter(...args);
    };
  }, [triggerLoading]);

  return {
    isLoading,
    triggerLoading,
    withLoading
  };
}; 