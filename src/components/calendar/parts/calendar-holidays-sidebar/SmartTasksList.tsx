"use client";

import { CheckCircle2, Circle, GripVertical, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SMART_TASKS } from "./types";

interface SmartTasksListProps {
  doneTasks: Record<number, boolean>;
  setDoneTasks: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
}

export function SmartTasksList({ doneTasks, setDoneTasks }: SmartTasksListProps) {
  return (
    <>
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
    </>
  );
}
