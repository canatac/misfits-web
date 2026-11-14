"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "misfits:url-scan-enabled";
const DEFAULT_ENABLED = true;

/**
 * User setting for URL scanning (AC5).
 * Persisted in localStorage; defaults to enabled.
 */
export function useUrlScanSetting() {
  const [urlScanEnabled, setUrlScanEnabled] = useState<boolean>(DEFAULT_ENABLED);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setUrlScanEnabled(stored === "true");
      }
    } catch {
      // localStorage unavailable (private mode): keep default
    }
  }, []);

  const toggleUrlScan = useCallback(() => {
    setUrlScanEnabled((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore persistence failure
      }
      return next;
    });
  }, []);

  return { urlScanEnabled, toggleUrlScan, setUrlScanEnabled };
}
