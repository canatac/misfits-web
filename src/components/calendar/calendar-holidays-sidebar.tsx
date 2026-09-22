"use client";

import { useState } from "react";
import type { CalendarEvent } from "@/types/calendar";
import { HolidayCountriesPicker } from "./parts/calendar-holidays-sidebar/HolidayCountriesPicker";
import { SmartTasksList } from "./parts/calendar-holidays-sidebar/SmartTasksList";
import type { HolidayEventInput } from "./parts/calendar-holidays-sidebar/types";
import { useHolidayCountries } from "./parts/calendar-holidays-sidebar/use-holiday-countries";
import { useHolidayImport } from "./parts/calendar-holidays-sidebar/use-holiday-import";

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
