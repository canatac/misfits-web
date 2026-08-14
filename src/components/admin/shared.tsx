/**
 * shared.tsx — Admin console shared utilities
 *
 * Extracted from admin-console-page.tsx as part of Sprint 3 refactor.
 * All tab sub-components import from here.
 */
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { ChangeRequestItem, WorkflowStatus } from "@/types/admin-ops";

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function asInt(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

export function asDate(ts: string): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export function minutesBetween(fromIso?: string, toIso?: string): number | null {
  if (!fromIso || !toIso) return null;
  const from = new Date(fromIso).getTime();
  const to   = new Date(toIso).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;
  return Math.round((to - from) / 60000);
}

export function formatDurationMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h < 24) return `${h}h ${m.toString().padStart(2, "0")}`;
  const d    = Math.floor(h / 24);
  const remH = h % 24;
  return `${d}j ${remH}h`;
}

// ─── Badge ────────────────────────────────────────────────────────────────────

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "danger" | "warn" | "ok";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
        tone === "neutral" && "border-[#313136] bg-[#1B1B1F] text-[#CFCFD4]",
        tone === "danger"  && "border-[#5B1F27] bg-[#2B1419] text-[#FCA5A5]",
        tone === "warn"    && "border-[#5E4A20] bg-[#2B2413] text-[#FCD34D]",
        tone === "ok"      && "border-[#1F4B3E] bg-[#10281F] text-[#86EFAC]"
      )}
    >
      {children}
    </span>
  );
}

// ─── Tone / state helpers ─────────────────────────────────────────────────────

export function priorityTone(
  priority: ChangeRequestItem["priority"]
): "danger" | "warn" | "ok" {
  if (priority === "P0") return "danger";
  if (priority === "P1") return "warn";
  return "ok";
}

export function statusTone(
  status: WorkflowStatus
): "danger" | "warn" | "ok" | "neutral" {
  if (status === "rejected") return "danger";
  if (status === "released") return "ok";
  if (status === "submitted" || status === "triaged") return "warn";
  return "neutral";
}

export type RunState = "running" | "queued" | "completed" | "failed";

export function runStateFromStatus(status: WorkflowStatus): RunState {
  if (status === "released")                              return "completed";
  if (status === "rejected")                              return "failed";
  if (status === "in_progress" || status === "qa")        return "running";
  return "queued";
}

export function runStateTone(
  state: RunState
): "danger" | "warn" | "ok" | "neutral" {
  if (state === "failed")    return "danger";
  if (state === "completed") return "ok";
  if (state === "queued")    return "warn";
  return "neutral";
}

export function runStateLabel(state: RunState): string {
  if (state === "running")   return "running";
  if (state === "queued")    return "queued";
  if (state === "completed") return "completed";
  return "failed";
}

export function executionStateTone(
  state: ChangeRequestItem["executionState"]
): "danger" | "warn" | "ok" | "neutral" {
  if (state === "failed")                        return "danger";
  if (state === "success")                       return "ok";
  if (state === "queued" || state === "running") return "warn";
  return "neutral";
}

export function executionStateLabel(
  state: ChangeRequestItem["executionState"]
): string {
  if (state === "running") return "running";
  if (state === "queued")  return "queued";
  if (state === "success") return "success";
  if (state === "failed")  return "failed";
  return "idle";
}
