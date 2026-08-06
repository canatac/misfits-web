"use client";

/**
 * /calendar route — renders the integrated calendar (Issue #153).
 */
import { CalendarPage } from "@/components/calendar/calendar-page";
import { AppSwitcher } from "@/components/navigation/app-switcher";

export default function CalendarRoute() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#E4E4E7]">
      <AppSwitcher className="border-[#242427] bg-[#111113]/95 text-[#E4E4E7]" />
      <div className="h-[calc(100vh-56px)]">
        <CalendarPage />
      </div>
    </div>
  );
}
