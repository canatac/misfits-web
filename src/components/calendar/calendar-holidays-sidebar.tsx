"use client";

import { useState, useEffect } from "react";
import type { CalendarEvent } from "@/types/calendar";
import { HolidayCountriesPicker } from "./parts/calendar-holidays-sidebar/HolidayCountriesPicker";
import { SmartTasksList } from "./parts/calendar-holidays-sidebar/SmartTasksList";
import type { HolidayEventInput } from "./parts/calendar-holidays-sidebar/types";
import { useHolidayCountries } from "./parts/calendar-holidays-sidebar/use-holiday-countries";
import { useHolidayImport } from "./parts/calendar-holidays-sidebar/use-holiday-import";

const STORAGE_KEY = "misfits_holiday_countries";

interface CalendarHolidaysSidebarProps {
  selectedDate: string;
  events: CalendarEvent[];
  createEvent: {
    mutateAsync: (input: HolidayEventInput) => Promise<unknown>;
  };
}

export function CalendarHolidaysSidebar({
  selectedDate,
  events,
  createEvent,
}: CalendarHolidaysSidebarProps) {
  const [doneTasks, setDoneTasks] = useState<Record<number, boolean>>({});
  const [selectedHolidayCountries, setSelectedHolidayCountries] = useState<
    string[]
  >(["FR"]);
  const [holidayCountriesSearch, setHolidayCountriesSearch] = useState("");

  // Load persisted countries on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedHolidayCountries(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist countries on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedHolidayCountries));
    } catch {
      // ignore
    }
  }, [selectedHolidayCountries]);

  const {
    holidayCountryOptions,
    holidaySupportedCodes,
    loadingHolidayCountries,
    filteredHolidayCountryOptions,
  } = useHolidayCountries(holidayCountriesSearch);

  const { importingHolidays, importPublicHolidays } = useHolidayImport({
    selectedDate,
    events,
    selectedHolidayCountries,
    createEvent,
  });

  return (
    <aside className="hidden w-80 flex-col border-r border-[#242427] bg-[#121214] p-5 xl:flex">
      <SmartTasksList doneTasks={doneTasks} setDoneTasks={setDoneTasks} />
      <HolidayCountriesPicker
        selectedDate={selectedDate}
        holidayCountriesSearch={holidayCountriesSearch}
        setHolidayCountriesSearch={setHolidayCountriesSearch}
        holidayCountryOptions={holidayCountryOptions}
        filteredHolidayCountryOptions={filteredHolidayCountryOptions}
        holidaySupportedCodes={holidaySupportedCodes}
        loadingHolidayCountries={loadingHolidayCountries}
        selectedHolidayCountries={selectedHolidayCountries}
        setSelectedHolidayCountries={setSelectedHolidayCountries}
        importingHolidays={importingHolidays}
        importPublicHolidays={importPublicHolidays}
      />
    </aside>
  );
}
