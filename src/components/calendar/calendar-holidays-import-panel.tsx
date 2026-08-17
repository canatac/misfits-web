"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useCalendarStore } from "@/stores/calendar-store";
import { useCalendarMutations } from "@/hooks/use-calendar";
import {
  fetchPublicHolidays,
  holidayKey,
  useHolidayCountries,
} from "@/hooks/use-holidays-import";

export function CalendarHolidaysImportPanel() {
  const selectedDate = useCalendarStore((s) => s.selectedDate);
  const events = useCalendarStore((s) => s.events);
  const { createEvent } = useCalendarMutations();

  const {
    holidayCountryOptions,
    holidaySupportedCodes,
    loadingHolidayCountries,
  } = useHolidayCountries();

  const [selectedHolidayCountries, setSelectedHolidayCountries] = useState<
    string[]
  >(["FR"]);
  const [holidayCountriesSearch, setHolidayCountriesSearch] = useState("");
  const [importingHolidays, setImportingHolidays] = useState(false);

  const filteredHolidayCountryOptions = useMemo(() => {
    const q = holidayCountriesSearch.trim().toLowerCase();
    if (!q) return holidayCountryOptions;
    return holidayCountryOptions.filter(
      (country) =>
        country.label.toLowerCase().includes(q) ||
        country.code.toLowerCase().includes(q)
    );
  }, [holidayCountriesSearch, holidayCountryOptions]);

  async function importPublicHolidays() {
    if (selectedHolidayCountries.length === 0) {
      toast.error("Sélectionnez au moins un pays");
      return;
    }
    const selectedYear = new Date(selectedDate).getFullYear();
    setImportingHolidays(true);
    try {
      const { holidays: fetchedHolidays, failed: failedCountries } =
        await fetchPublicHolidays(selectedYear, selectedHolidayCountries);

      if (fetchedHolidays.length === 0) {
        throw new Error("Aucun jour férié récupéré");
      }

      const existingKeys = new Set(
        events.map((event) => holidayKey(event.start.slice(0, 10), event.title))
      );
      const toCreate: {
        title: string;
        description: string;
        start: string;
        end: string;
        eventType: "reminder";
        color: string;
        location: string;
      }[] = [];

      fetchedHolidays.forEach((holiday) => {
        const title = `${holiday.localName || holiday.name} (${holiday.countryCode})`;
        const key = holidayKey(holiday.date, title);
        if (existingKeys.has(key)) return;
        existingKeys.add(key);
        toCreate.push({
          title,
          description: `Jour férié importé (${holiday.countryCode})`,
          start: `${holiday.date}T09:00:00.000Z`,
          end: `${holiday.date}T10:00:00.000Z`,
          eventType: "reminder",
          color: "#EF4444",
          location: holiday.countryCode,
        });
      });

      if (toCreate.length === 0) {
        toast.message("Aucun nouveau jour férié à importer");
        return;
      }

      const createResults = await Promise.allSettled(
        toCreate.map((event) => createEvent.mutateAsync(event))
      );
      const createdCount = createResults.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failedCreates = createResults.length - createdCount;

      toast.success(
        `${createdCount} jour${createdCount === 1 ? "" : "s"} férié${createdCount === 1 ? "" : "s"} importé${createdCount === 1 ? "" : "s"}`
      );

      if (failedCountries.length > 0 || failedCreates > 0) {
        const warnings: string[] = [];
        if (failedCountries.length > 0) {
          warnings.push(`Pays indisponibles: ${failedCountries.join(", ")}`);
        }
        if (failedCreates > 0) {
          warnings.push(
            `${failedCreates} création${failedCreates === 1 ? "" : "s"} en échec`
          );
        }
        toast.warning(warnings.join(" · "));
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Import impossible: ${error.message}`
          : "Import impossible"
      );
    } finally {
      setImportingHolidays(false);
    }
  }

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
