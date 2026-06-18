import { useState, useEffect, useRef, useCallback } from "react";

interface ApiState<T> {
  data:    T;
  loading: boolean;
  error:   string | null;
  refresh: () => void;
}

/**
 * Generic data-fetching hook.
 * - Calls `fetcher` immediately and every `refreshMs` ms.
 * - Returns `fallback` on error (stable reference via useRef).
 * - Never returns null — consumers always get either real data or fallback.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  refreshMs = 15_000
): ApiState<T> {
  // Keep fallback stable — even if the caller passes an inline object literal,
  // we pin the first reference so state comparisons stay predictable.
  const fallbackRef = useRef<T>(fallback);

  const [data,    setData]    = useState<T>(fallbackRef.current);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (e: unknown) {
      console.warn("[useApi] fetch failed, using fallback:", e instanceof Error ? e.message : e);
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : String(e));
        // Only set fallback if we have no real data yet
        setData(prev => (prev === fallbackRef.current ? fallbackRef.current : prev));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  // fetcher identity is intentionally excluded — wrap it in useCallback at call-site if needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    if (refreshMs > 0) {
      timerRef.current = setInterval(load, refreshMs);
    }
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load, refreshMs]);

  return { data, loading, error, refresh };
}
