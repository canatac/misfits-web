"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { CalendarEvent } from "@/types/calendar";
import {
  holidayKey,
  type HolidayEventInput,
  type PublicHolidayApiItem,
} from "./types";

interface UseHolidayImportArgs {
  selectedDate: string;
  events: CalendarEvent[];
  selectedHolidayCountries: string[];
  createEvent: {
    mutateAsync: (input: HolidayEventInput) => Promise<unknown>;
  };
}

export function useHolidayImport({
  selectedDate,
  events,
  selectedHolidayCountries,
  createEvent,
}: UseHolidayImportArgs) {
  const [importingHolidays, setImportingHolidays] = useState(false);

  async function importPublicHolidays() {
    if (selectedHolidayCountries.length === 0) {
      toast.error("Sélectionnez au moins un pays");
      return;
    }

    const selectedYear = new Date(selectedDate).getFullYear();
    setImportingHolidays(true);

    try {
      const fetchResults = await Promise.allSettled(
        selectedHolidayCountries.map(async (countryCode) => {
          const response = await fetch(
            `https://date.nager.at/api/v3/PublicHolidays/${selectedYear}/${countryCode}`
          );
          if (!response.ok) {
            throw new Error(`${countryCode} (${response.status})`);
          }
          const data = (await response.json()) as PublicHolidayApiItem[];
          return data;
        })
      );

      const failedCountries: string[] = [];
      const fetchedHolidays: PublicHolidayApiItem[] = [];
      fetchResults.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          fetchedHolidays.push(...result.value);
          return;
        }
        failedCountries.push(selectedHolidayCountries[idx]);
      });

      if (fetchedHolidays.length === 0) {
        throw new Error("Aucun jour férié récupéré");
      }

      const existingKeys = new Set(
        events.map((event) =>
          holidayKey(event.start.slice(0, 10), event.title)
        )
      );
      const toCreate: HolidayEventInput[] = [];

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

  return { importingHolidays, importPublicHolidays };
}
