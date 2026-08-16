"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  CountryOption,
  NagerCountryItem,
  RestCountryItem,
} from "./types";

export function useHolidayCountries(holidayCountriesSearch: string) {
  const [holidayCountryOptions, setHolidayCountryOptions] = useState<
    CountryOption[]
  >([]);
  const [holidaySupportedCodes, setHolidaySupportedCodes] = useState<
    Set<string>
  >(() => new Set());
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
                label:
                  frTranslation || c.name?.common || c.cca2.toUpperCase(),
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

  const filteredHolidayCountryOptions = useMemo(() => {
    const q = holidayCountriesSearch.trim().toLowerCase();
    if (!q) return holidayCountryOptions;
    return holidayCountryOptions.filter((country) => {
      return (
        country.label.toLowerCase().includes(q) ||
        country.code.toLowerCase().includes(q)
      );
    });
  }, [holidayCountriesSearch, holidayCountryOptions]);

  return {
    holidayCountryOptions,
    holidaySupportedCodes,
    loadingHolidayCountries,
    filteredHolidayCountryOptions,
  };
}
