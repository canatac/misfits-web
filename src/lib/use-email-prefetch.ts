import { useCallback, useEffect, useRef } from "react";
import { EmailPrefetchCache, getGlobalPrefetchCache, PrefetchEntry } from "./email-prefetch";

export interface UsePrefetchOptions {
  maxCache?: number;
  cancelDelay?: number;
}

export function useEmailPrefetch(options?: UsePrefetchOptions) {
  const cacheRef = useRef<EmailPrefetchCache | null>(null);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!cacheRef.current) {
    cacheRef.current = new EmailPrefetchCache(options);
  }

  const prefetch = useCallback(
    (id: string, fetcher: () => Promise<unknown>) => {
      if (cacheRef.current!.has(id)) return;

      const controller = new AbortController();

      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current);
      }

      cancelTimerRef.current = setTimeout(() => {
        controller.abort();
      }, options?.cancelDelay ?? 200);

      fetcher()
        .then((data) => {
          if (!controller.signal.aborted) {
            cacheRef.current!.set(id, data);
          }
          if (cancelTimerRef.current) {
            clearTimeout(cancelTimerRef.current);
            cancelTimerRef.current = null;
          }
        })
        .catch(() => {
          if (cancelTimerRef.current) {
            clearTimeout(cancelTimerRef.current);
            cancelTimerRef.current = null;
          }
        });
    },
    [options?.cancelDelay]
  );

  const getCached = useCallback((id: string): unknown | undefined => {
    return cacheRef.current?.get(id);
  }, []);

  const cancelAll = useCallback(() => {
    if (cancelTimerRef.current) {
      clearTimeout(cancelTimerRef.current);
      cancelTimerRef.current = null;
    }
    cacheRef.current?.cancelAll();
  }, []);

  useEffect(() => {
    return () => {
      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current);
      }
    };
  }, []);

  return { prefetch, getCached, cancelAll, cache: cacheRef.current! };
}

export { getGlobalPrefetchCache, EmailPrefetchCache, type PrefetchEntry };
