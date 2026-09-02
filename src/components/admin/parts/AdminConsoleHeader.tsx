"use client";

import { cn } from "@/lib/utils";
import {
  type AdminTab,
  WINDOW_OPTIONS,
  SEVERITY_OPTIONS,
} from "../admin-console-constants";
import type { MonitoringWindow } from "@/types/monitoring";
import type { SecuritySeverity } from "@/types/security";

interface AdminConsoleHeaderProps {
  windowRange: MonitoringWindow;
  setWindowRange: (v: MonitoringWindow) => void;
  severity: SecuritySeverity | "all";
  setSeverity: (v: SecuritySeverity | "all") => void;
  activeTab: AdminTab;
  setActiveTab: (t: AdminTab) => void;
}

const TABS: ReadonlyArray<readonly [AdminTab, string]> = [
  ["overview", "Vue globale"],
  ["monitoring", "Monitoring SMTP"],
  ["security", "Sécurité"],
  ["deliverability-ops", "Deliverability Ops"],
  ["changelog", "Changelog"],
  ["change-requests", "Change requests"],
  ["users", "Utilisateurs"],
] as const;

export function AdminConsoleHeader({
  windowRange,
  setWindowRange,
  severity,
  setSeverity,
  activeTab,
  setActiveTab,
}: AdminConsoleHeaderProps) {
  return (
    <header className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#F4F4F5]">
            Console Admin
          </h1>
          <p className="text-sm text-[#A1A1AA]">
            Monitoring SMTP, sécurité anti-phishing, incidents, change
            requests.
          </p>
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Fenêtre temporelle monitoring"
        >
          {WINDOW_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setWindowRange(opt)}
              aria-pressed={windowRange === opt}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs",
                windowRange === opt
                  ? "border-[#C49B66] bg-[#2A2218] text-[#F2D5A7]"
                  : "border-[#2B2B31] bg-[#151518] text-[#B4B4BB] hover:border-[#3A3A42]"
              )}
            >
              {opt}
            </button>
          ))}
          <select
            value={severity}
            onChange={(e) =>
              setSeverity(e.target.value as SecuritySeverity | "all")
            }
            className="rounded-lg border border-[#2B2B31] bg-[#151518] px-2.5 py-1 text-xs text-[#D4D4D8]"
            aria-label="Filtrer la sévérité sécurité"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                severity: {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="mt-4 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Navigation de la console admin"
      >
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            role="tab"
            id={`admin-tab-${key}`}
            aria-selected={activeTab === key}
            aria-controls={`admin-panel-${key}`}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium",
              activeTab === key
                ? "border-[#C49B66] bg-[#2A2218] text-[#F2D5A7]"
                : "border-[#2B2B31] bg-[#151518] text-[#B4B4BB] hover:border-[#3A3A42]"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
