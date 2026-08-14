"use client";
import React from "react";
import { Badge, asDate } from "../../shared";
import type { ActiveTabScope, SecurityAlert } from "./types";

interface AlertsIncidentsSectionProps {
  activeTab: ActiveTabScope;
  securityActiveAlerts: SecurityAlert[];
  securityIncidents: SecurityAlert[];
}

export function AlertsIncidentsSection({
  activeTab,
  securityActiveAlerts,
  securityIncidents,
}: AlertsIncidentsSectionProps) {
  return (
    <>
{(activeTab === "overview" || activeTab === "security") && (
  <section className="grid gap-3 xl:grid-cols-2">
    <article className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
      <h2 className="mb-3 text-sm font-semibold text-[#E4E4E7]">
        Alertes sécurité actives
      </h2>
      <div className="space-y-2">
        {(securityActiveAlerts).slice(0, 10).map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-[#E4E4E7]">{alert.rule_name}</p>
              <Badge
                tone={
                  alert.severity === "critical" ||
                  alert.severity === "high"
                    ? "danger"
                    : alert.severity === "medium"
                      ? "warn"
                      : "ok"
                }
              >
                {alert.severity}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-[#71717A]">
              {alert.tenant_id ?? "global"} · confidence{" "}
              {Math.round(alert.confidence * 100)}% · {asDate(alert.ts)}
            </p>
          </div>
        ))}
        {!securityActiveAlerts?.length && (
          <p className="text-sm text-[#71717A]">
            Aucune alerte active pour ce filtre.
          </p>
        )}
      </div>
    </article>

    <article className="rounded-2xl border border-[#242427] bg-[#0F0F11]/92 p-4 shadow-2xl">
      <h2 className="mb-3 text-sm font-semibold text-[#E4E4E7]">
        Incidents (historique récent)
      </h2>
      <div className="space-y-2">
        {(securityIncidents)
          .slice(0, 10)
          .map((incident) => (
            <div
              key={incident.id}
              className="rounded-xl border border-[#232327] bg-[#151518] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-[#E4E4E7]">
                  {incident.rule_name}
                </p>
                <Badge tone={incident.rolled_back ? "ok" : "neutral"}>
                  {incident.rolled_back ? "rolled back" : incident.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[#71717A]">
                action {incident.action} · level{" "}
                {incident.remediation_level} · {asDate(incident.ts)}
              </p>
            </div>
          ))}
        {!securityIncidents.length && (
          <p className="text-sm text-[#71717A]">
            Aucun incident sur ce filtre.
          </p>
        )}
      </div>
    </article>
  </section>
)}
    </>
  );
}
