"use client";

import { Calendar } from "lucide-react";
import type { DashboardTaskItem } from "../types";

export function RdvList({ events }: { events: DashboardTaskItem[] }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-[10px] font-semibold tracking-widest text-[#52525B] uppercase">
        Rendez-vous aujourd’hui
      </p>
      <ul className="space-y-1.5">
        {events.length === 0 && (
          <li className="rounded-lg bg-[#1D1D20] px-3 py-2 text-[11px] text-[#71717A]">
            Aucun rendez-vous planifié aujourd’hui.
          </li>
        )}
        {events.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-lg bg-[#1D1D20] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-[#38BDF8]" />
              <span className="text-xs font-medium text-[#E4E4E7]">{r.label}</span>
            </div>
            <span className="font-mono text-[11px] text-[#38BDF8]">{r.due ?? "—"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
