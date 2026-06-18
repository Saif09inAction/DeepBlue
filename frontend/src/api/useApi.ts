import { useState, useEffect, useRef, useCallback } from "react";

interface ApiState<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
  refresh: () => void;
}

/**
 * Generic hook that calls `fetcher` immediately and every `refreshMs` ms.
 * Falls back to `fallback` if the fetch fails.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  fallback: T,
  refreshMs = 15_000
): ApiState<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (e: unknown) {
      console.warn("[useApi] fetch failed, using fallback:", e);
      setError(e instanceof Error ? e.message : String(e));
      setData(fallback as T);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    load();
    if (refreshMs > 0) {
      timerRef.current = setInterval(load, refreshMs);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load, refreshMs]);

  return { data: data ?? fallback, loading, error, refresh };
}
