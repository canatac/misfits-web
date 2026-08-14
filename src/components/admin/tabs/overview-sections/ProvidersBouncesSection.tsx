"use client";
import React from "react";
import { Badge, asInt } from "../../shared";
import type { ActiveTabScope, MonitoringProvider, SmtpEvent } from "./types";

interface ProvidersBouncesSectionProps {
  activeTab: ActiveTabScope;
  monitoringProviders: MonitoringProvider[];
  monitoringBounces: SmtpEvent[];
}

export function ProvidersBouncesSection({
  activeTab,
  monitoringProviders,
  monitoringBounces,
}: ProvidersBouncesSectionProps) {
  return (
    <>
{(activeTab === "overview" || activeTab === "monitoring") && (
  <section className="grid gap-3 xl:grid-cols-2">
    <article className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
      <h2 className="mb-3 text-sm font-semibold text-[#E4E4E7]">
        Top providers
      </h2>
      <div className="space-y-2">
        {(monitoringProviders)
          .slice(0, 8)
          .map((provider, idx) => (
            <div
              key={`${provider.company ?? "unknown"}-${idx}`}
              className="flex items-center justify-between rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
            >
              <div>
                <p className="text-sm text-[#E4E4E7]">
                  {provider.company ??
                    provider.datacenter ??
                    "Unknown provider"}
                </p>
                <p className="text-xs text-[#71717A]">
                  {provider.country ?? "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#E4E4E7]">
                  {asInt(provider.count)} events
                </p>
                <p className="text-xs text-[#71717A]">
                  avg {Math.round(provider.avg_total_ms)} ms
                </p>
              </div>
            </div>
          ))}
        {!monitoringProviders?.length && (
          <p className="text-sm text-[#71717A]">
            Aucune donnée provider pour la fenêtre sélectionnée.
          </p>
        )}
      </div>
    </article>

    <article className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
      <h2 className="mb-3 text-sm font-semibold text-[#E4E4E7]">
        Bounces (récentes)
      </h2>
      <div className="space-y-2">
        {(monitoringBounces)
          .slice(0, 8)
          .map((bounce) => (
            <div
              key={bounce.id}
              className="rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs text-[#D4D4D8]">
                  {bounce.to}
                </p>
                <Badge
                  tone={bounce.bounce_type === "hard" ? "danger" : "warn"}
                >
                  {bounce.bounce_type ?? "bounce"}
                </Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-[#71717A]">
                {bounce.bounce_reason ?? "No reason provided"}
              </p>
            </div>
          ))}
        {!monitoringBounces?.length && (
          <p className="text-sm text-[#71717A]">
            Aucun bounce sur la fenêtre sélectionnée.
          </p>
        )}
      </div>
    </article>
  </section>
)}
    </>
  );
}
