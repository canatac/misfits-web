"use client";
import React from "react";
import { Badge, asDate } from "../../shared";
import type { ActiveTabScope, SecurityLive } from "./types";

interface SecurityLiveStreamSectionProps {
  activeTab: ActiveTabScope;
  securityLive: SecurityLive;
}

export function SecurityLiveStreamSection({
  activeTab,
  securityLive,
}: SecurityLiveStreamSectionProps) {
  return (
    <>
{(activeTab === "overview" || activeTab === "security") && (
  <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-[#E4E4E7]">
        Live security stream
      </h2>
      <Badge tone={securityLive.isConnected ? "ok" : "warn"}>
        {securityLive.isConnected ? "connected" : "disconnected"}
      </Badge>
    </div>
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {securityLive.alerts.slice(0, 9).map((alert) => (
        <div
          key={alert.id}
          className="rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
        >
          <p className="text-xs text-[#A1A1AA]">{alert.rule_id}</p>
          <p className="truncate text-sm text-[#E4E4E7]">
            {alert.rule_name}
          </p>
          <p className="mt-1 text-xs text-[#71717A]">
            {asDate(alert.ts)}
          </p>
        </div>
      ))}
    </div>
  </section>
)}
    </>
  );
}
