"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import fr from "@/i18n/messages/fr";
import en from "@/i18n/messages/en";

const STORAGE_KEY = "misfits.locale";

const MESSAGES = {
  fr,
  en,
} as const;

type Dictionary = (typeof MESSAGES)[Locale];

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedValue(dict: Dictionary, path: string): string | null {
  const tokens = path.split(".");
  let cursor: unknown = dict;
  for (const token of tokens) {
    if (!cursor || typeof cursor !== "object" || !(token in cursor)) {
      return null;
    }
    cursor = (cursor as Record<string, unknown>)[token];
  }
  return typeof cursor === "string" ? cursor : null;
}

function detectLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && isLocale(stored)) return stored;

  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("fr")) return "fr";
  if (browser.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const active = MESSAGES[locale];
      const fallback = MESSAGES[DEFAULT_LOCALE];
      return (
        getNestedValue(active, key) ?? getNestedValue(fallback, key) ?? key
      );
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
