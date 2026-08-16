"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarHolidaysImportPanel } from "./calendar-holidays-import-panel";

const SMART_TASKS = [
  "Répondre au contrat Q4",
  "Valider copy onboarding mail",
  "Revue sécurité du matin",
  "Synchroniser roadmap sprint",
];

export function CalendarSmartTasksSidebar() {
  const [doneTasks, setDoneTasks] = useState<Record<number, boolean>>({});
  return (
    <aside className="hidden w-80 flex-col border-r border-[#242427] bg-[#121214] p-5 xl:flex">
      <div className="mb-4 flex items-center justify-between border-b border-[#242427] pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-[#242427] bg-[#1D1D20] p-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#C49B66]" />
          </div>
          <h2 className="text-sm font-bold text-white">Tâches prioritaires</h2>
        </div>
        <Sparkles className="h-4 w-4 text-[#C49B66]" />
      </div>

      <div className="space-y-2.5 overflow-y-auto pr-1">
        {SMART_TASKS.map((task, idx) => {
          const done = Boolean(doneTasks[idx]);
          return (
            <button
              key={task}
              type="button"
              onClick={() =>
                setDoneTasks((prev) => ({ ...prev, [idx]: !prev[idx] }))
              }
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-xs",
                done
                  ? "border-[#242427] bg-[#121214] text-[#71717A]"
                  : "border-[#242427] bg-[#161619] text-[#E0E0E0] hover:border-[#C49B66]/60"
              )}
            >
              <div className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-[#C49B66]" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span className={done ? "line-through" : ""}>{task}</span>
              </div>
              <GripVertical className="h-4 w-4 text-[#71717A]" />
            </button>
          );
        })}
      </div>

      <CalendarHolidaysImportPanel />
    </aside>
  );
}
