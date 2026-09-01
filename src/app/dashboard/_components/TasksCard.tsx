"use client";

import Link from "next/link";
import { ArrowUpRight, CheckSquare, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardTaskItem } from "../types";
import { RdvList } from "./RdvList";

export function TasksCard({
  tasks,
  doneIds,
  onToggle,
}: {
  tasks: DashboardTaskItem[];
  doneIds: Set<string>;
  onToggle: (task: DashboardTaskItem) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-[#38BDF8]" />
          <h2 className="text-sm font-bold text-white">Actions & Agenda</h2>
        </div>
        <Link
          href="/calendar"
          className="flex items-center gap-0.5 text-[11px] font-medium text-[#38BDF8] hover:underline"
        >
          Calendrier <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex-1 px-4 py-3">
        <ul className="space-y-1.5">
          {tasks.length === 0 && (
            <li className="rounded-lg border border-[#242427] bg-[#0A0A0B] px-2 py-2 text-[11px] text-[#71717A]">
              Aucune action issue du calendrier pour aujourd’hui.
            </li>
          )}
          {tasks.map((task) => {
            const done = doneIds.has(task.id);
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onToggle(task)}
                  className="flex w-full items-start gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:border-[#242427] hover:bg-[#1D1D20]"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
                      done ? "border-[#38BDF8] bg-[#38BDF8]" : "border-[#3A3A3F]"
                    )}
                  >
                    {done && <span className="h-2 w-2 rounded-sm bg-[#121214]" />}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate text-xs font-medium",
                        done ? "text-[#52525B] line-through" : "text-[#D4D4D8]"
                      )}
                    >
                      {task.label}
                    </p>
                    <p className="text-[10px] text-[#3F3F46]">{task.ref}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
        <RdvList events={tasks.filter((t) => (t.ref ?? "").includes("Calendrier"))} />
      </div>
      <div className="border-t border-[#242427] px-4 py-3">
        <Link
          href="/calendar"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#242427] bg-[#1D1D20] px-3 py-2 text-xs font-semibold text-white transition hover:border-[#38BDF8]/50 hover:bg-[#242427]"
        >
          Ouvrir calendrier <ArrowUpRight className="h-3.5 w-3.5 text-[#38BDF8]" />
        </Link>
      </div>
    </div>
  );
}
