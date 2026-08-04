"use client";

/**
 * /calendar route — renders the integrated calendar (Issue #153).
 */
import { CalendarPage } from "@/components/calendar/calendar-page";
import { AppSwitcher } from "@/components/navigation/app-switcher";

export default function CalendarRoute() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AppSwitcher />
      <div className="h-[calc(100vh-56px)]">
        <CalendarPage />
      </div>
    </div>
  );
}
