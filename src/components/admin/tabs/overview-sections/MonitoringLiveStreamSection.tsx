"use client";
import React from "react";
import { Badge, asDate } from "../../shared";
import type { ActiveTabScope, MonitoringLive } from "./types";

interface MonitoringLiveStreamSectionProps {
  activeTab: ActiveTabScope;
  monitoringLive: MonitoringLive | undefined;
}

export function MonitoringLiveStreamSection({
  activeTab,
  monitoringLive,
}: MonitoringLiveStreamSectionProps) {
  return (
    <>
{(activeTab === "overview" || activeTab === "monitoring") && (
  <section className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-[#E4E4E7]">
        Live monitoring stream
      </h2>
      <Badge tone={(monitoringLive?.isConnected ?? false) ? "ok" : "warn"}>
        {(monitoringLive?.isConnected ?? false) ? "connected" : "disconnected"}
      </Badge>
    </div>
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
      {(monitoringLive?.events ?? []).slice(0, 9).map((evt: { id?: string; kind?: string; event_type?: string; ts?: string; message?: string; level?: string; to?: string }) => (
        <div
          key={evt.id}
          className="rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
        >
          <p className="text-xs text-[#A1A1AA]">{evt.event_type}</p>
          <p className="truncate text-sm text-[#E4E4E7]">{evt.to}</p>
          <p className="mt-1 text-xs text-[#71717A]">{asDate(evt.ts ?? '')}</p>
        </div>
      ))}
    </div>
  </section>
)}
    </>
  );
}
