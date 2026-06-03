import { useState, useEffect, useRef } from 'react';

interface PageVisibilityState {
  isVisible: boolean;
  visibilityState: DocumentVisibilityState;
  lastChange: number;
}

/**
 * Hook to track page visibility changes with debouncing
 * Prevents rapid-fire operations when quickly switching tabs
 *
 * @param debounceMs - Milliseconds to wait before updating state (default 500ms)
 */
export function usePageVisibility(debounceMs: number = 500): PageVisibilityState {
  const [state, setState] = useState<PageVisibilityState>({
    isVisible: !document.hidden,
    visibilityState: document.visibilityState,
    lastChange: Date.now(),
  });

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      // Clear any pending debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      const newVisibilityState: PageVisibilityState = {
        isVisible: !document.hidden,
        visibilityState: document.visibilityState,
        lastChange: Date.now(),
      };

      // If page is becoming hidden, update immediately (no need to debounce)
      if (document.hidden) {
        setState(newVisibilityState);
        return;
      }

      // If page is becoming visible, debounce to prevent rapid-fire operations
      debounceTimer.current = setTimeout(() => {
        setState(newVisibilityState);
      }, debounceMs);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [debounceMs]);

  return state;
}
