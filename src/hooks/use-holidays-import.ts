"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export interface CountryOption {
  code: string;
  label: string;
}

export interface PublicHolidayApiItem {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
}

interface NagerCountryItem {
  countryCode: string;
  name: string;
}

interface RestCountryItem {
  cca2: string;
  name?: { common?: string };
  translations?: { fra?: { common?: string } | string };
}

export function holidayKey(date: string, title: string): string {
  return `${date}|${title.trim().toLowerCase()}`;
}

export function useHolidayCountries() {
  const [holidayCountryOptions, setHolidayCountryOptions] = useState<
    CountryOption[]
  >([]);
  const [holidaySupportedCodes, setHolidaySupportedCodes] = useState<Set<string>>(
    () => new Set()
  );
  const [loadingHolidayCountries, setLoadingHolidayCountries] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadHolidayCountries() {
      setLoadingHolidayCountries(true);
      try {
        const [worldRes, supportedRes] = await Promise.allSettled([
          fetch(
            "https://raw.githubusercontent.com/mledoze/countries/master/countries.json"
          ),
          fetch("https://date.nager.at/api/v3/AvailableCountries"),
        ]);

        let options: CountryOption[] = [];
        if (worldRes.status === "fulfilled" && worldRes.value.ok) {
          const world = (await worldRes.value.json()) as RestCountryItem[];
          options = world
            .filter((c) => typeof c.cca2 === "string" && c.cca2.length === 2)
            .map((c) => {
              const frTranslation =
                typeof c.translations?.fra === "string"
                  ? c.translations.fra
                  : c.translations?.fra?.common;
              return {
                code: c.cca2.toUpperCase(),
                label: frTranslation || c.name?.common || c.cca2.toUpperCase(),
              };
            })
            .sort((a, b) => a.label.localeCompare(b.label, "fr"));
        }

        let supported = new Set<string>();
        if (supportedRes.status === "fulfilled" && supportedRes.value.ok) {
          const nager = (await supportedRes.value.json()) as NagerCountryItem[];
          supported = new Set(
            nager
              .map((country) => country.countryCode?.toUpperCase())
              .filter((code): code is string => Boolean(code))
          );
        }

        if (!cancelled) {
          setHolidayCountryOptions(options);
          setHolidaySupportedCodes(supported);
        }
      } catch {
        if (!cancelled) {
          toast.error("Impossible de charger la liste mondiale des pays");
        }
      } finally {
        if (!cancelled) {
          setLoadingHolidayCountries(false);
        }
      }
    }
    loadHolidayCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    holidayCountryOptions,
    holidaySupportedCodes,
    loadingHolidayCountries,
  };
}

export async function fetchPublicHolidays(
  year: number,
  countries: string[]
): Promise<{ holidays: PublicHolidayApiItem[]; failed: string[] }> {
  const fetchResults = await Promise.allSettled(
    countries.map(async (countryCode) => {
      const response = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
      );
      if (!response.ok) {
        throw new Error(`${countryCode} (${response.status})`);
      }
      return (await response.json()) as PublicHolidayApiItem[];
    })
  );

  const failed: string[] = [];
  const holidays: PublicHolidayApiItem[] = [];
  fetchResults.forEach((result, idx) => {
    if (result.status === "fulfilled") {
      holidays.push(...result.value);
      return;
    }
    failed.push(countries[idx]);
  });
  return { holidays, failed };
}
