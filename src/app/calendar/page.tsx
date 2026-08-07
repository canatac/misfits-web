"use client";

/**
 * /calendar route — renders the integrated calendar (Issue #153).
 */
import { CalendarPage } from "@/components/calendar/calendar-page";
import { NovamailWorkspaceShell } from "@/components/navigation/novamail-workspace-shell";

export default function CalendarRoute() {
  return (
    <NovamailWorkspaceShell contentClassName="p-0">
      <div className="h-[calc(100vh-56px)]">
        <CalendarPage />
      </div>
    </NovamailWorkspaceShell>
  );
}
