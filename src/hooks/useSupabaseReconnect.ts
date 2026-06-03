import { useEffect, useRef, useCallback } from 'react';
import { usePageVisibility } from './usePageVisibility';
import { tokens } from '../lib/api';

interface ReconnectOptions {
  onReconnect?: () => void;
  onReconnecting?: () => void;
  onReconnectSuccess?: () => void;
  onReconnectError?: (error: Error) => void;
}

/**
 * Re-trigger realtime (WebSocket) re-subscription when the page becomes visible.
 * Token refresh is handled transparently by the API client, so this just fires
 * the onReconnect callback for components to rebuild their WS channels.
 */
export function useSupabaseReconnect(options: ReconnectOptions = {}) {
  const { isVisible } = usePageVisibility();
  const wasVisible = useRef(isVisible);
  const lastVisibilityChange = useRef(Date.now());

  const reconnect = useCallback(async () => {
    if (!tokens.access) return;
    options.onReconnecting?.();
    try {
      options.onReconnectSuccess?.();
      options.onReconnect?.();
    } catch (error) {
      options.onReconnectError?.(error as Error);
    }
  }, [options]);

  useEffect(() => {
    if (isVisible && !wasVisible.current) {
      const now = Date.now();
      if (now - lastVisibilityChange.current < 2000) {
        wasVisible.current = isVisible;
        lastVisibilityChange.current = now;
        return;
      }
      reconnect();
      lastVisibilityChange.current = now;
    }
    wasVisible.current = isVisible;
  }, [isVisible, reconnect]);

  return { reconnect };
}
