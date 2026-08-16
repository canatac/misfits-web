"use client";

import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALERTS } from "../dashboard-fixtures";

export function AlertsCard({
  onOpen,
}: {
  onOpen: (alert: (typeof ALERTS)[number]) => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-[#242427] bg-[#121214] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#242427] px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Ops & Alertes</h2>
        </div>
        <span className="rounded-sm bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
          {ALERTS.length} actives
        </span>
      </div>
      <ul className="flex-1 space-y-2 px-4 py-3">
        {ALERTS.map((alert) => (
          <li key={alert.id}>
            <button
              type="button"
              onClick={() => onOpen(alert)}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition hover:opacity-90",
                alert.bg,
                alert.border
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="text-xs leading-tight font-bold"
                  style={{ color: alert.accent }}
                >
                  {alert.title}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-[#71717A]">{alert.time}</span>
              </div>
              <p className="mt-1 text-[11px] text-[#A1A1AA]">{alert.description}</p>
              <p
                className="mt-1.5 text-[11px] font-medium"
                style={{ color: alert.accent }}
              >
                {alert.cta} ↗
              </p>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-[#242427] px-4 py-3">
        <p className="text-center text-[10px] text-[#3F3F46]">
          Système autonome sous surveillance continue.
        </p>
      </div>
    </div>
  );
}
