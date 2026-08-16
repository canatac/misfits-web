"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { CountryOption } from "./types";

interface HolidayCountriesPickerProps {
  selectedDate: string;
  holidayCountriesSearch: string;
  setHolidayCountriesSearch: (value: string) => void;
  holidayCountryOptions: CountryOption[];
  filteredHolidayCountryOptions: CountryOption[];
  holidaySupportedCodes: Set<string>;
  loadingHolidayCountries: boolean;
  selectedHolidayCountries: string[];
  setSelectedHolidayCountries: React.Dispatch<React.SetStateAction<string[]>>;
  importingHolidays: boolean;
  importPublicHolidays: () => Promise<void>;
}

export function HolidayCountriesPicker({
  selectedDate,
  holidayCountriesSearch,
  setHolidayCountriesSearch,
  holidayCountryOptions,
  filteredHolidayCountryOptions,
  holidaySupportedCodes,
  loadingHolidayCountries,
  selectedHolidayCountries,
  setSelectedHolidayCountries,
  importingHolidays,
  importPublicHolidays,
}: HolidayCountriesPickerProps) {
  return (
    <div className="mt-5 border-t border-[#242427] pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-wide text-white uppercase">
          Jours fériés
        </h3>
        <span className="text-[10px] text-[#71717A]">
          {new Date(selectedDate).getFullYear()}
        </span>
      </div>

      <Input
        value={holidayCountriesSearch}
        onChange={(e) => setHolidayCountriesSearch(e.target.value)}
        placeholder="Rechercher un pays (nom ou code ISO)"
        className="mb-2 border-[#242427] bg-[#161619] text-xs"
        aria-label="Rechercher un pays"
      />

      <div className="mb-2 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-[#242427] bg-[#161619] px-2 text-[10px]"
          onClick={() =>
            setSelectedHolidayCountries(
              holidayCountryOptions.map((country) => country.code)
            )
          }
          disabled={holidayCountryOptions.length === 0}
        >
          Tout cocher
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-[#242427] bg-[#161619] px-2 text-[10px]"
          onClick={() => setSelectedHolidayCountries([])}
          disabled={selectedHolidayCountries.length === 0}
        >
          Tout décocher
        </Button>
      </div>

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-[#242427] bg-[#161619] p-3">
        {loadingHolidayCountries && (
          <p className="text-xs text-[#71717A]">Chargement des pays…</p>
        )}
        {!loadingHolidayCountries &&
          filteredHolidayCountryOptions.length === 0 && (
            <p className="text-xs text-[#71717A]">Aucun pays trouvé</p>
          )}
        {!loadingHolidayCountries &&
          filteredHolidayCountryOptions.map((country) => {
            const checked = selectedHolidayCountries.includes(country.code);
            const supported = holidaySupportedCodes.has(country.code);
            return (
              <label
                key={country.code}
                className="flex cursor-pointer items-center justify-between gap-2 text-xs text-[#D4D4D8]"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{country.label}</span>
                  <span className="text-[10px] text-[#71717A]">
                    {country.code}
                    {!supported ? " · API jours fériés indisponible" : ""}
                  </span>
                </span>
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => {
                    setSelectedHolidayCountries((prev) => {
                      if (value === true && !prev.includes(country.code)) {
                        return [...prev, country.code];
                      }
                      if (value !== true) {
                        return prev.filter((code) => code !== country.code);
                      }
                      return prev;
                    });
                  }}
                  aria-label={`Activer ${country.label}`}
                />
              </label>
            );
          })}
      </div>

      <Button
        onClick={importPublicHolidays}
        loading={importingHolidays}
        className="mt-3 w-full bg-[#C49B66] text-[#0A0A0B] hover:bg-[#d5ad78]"
      >
        Importer les jours fériés
      </Button>
    </div>
  );
}
