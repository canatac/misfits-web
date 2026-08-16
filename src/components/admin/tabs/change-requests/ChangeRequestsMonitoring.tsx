"use client";
import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Badge,
  asInt,
  asDate,
  percent,
  formatDurationMinutes,
  statusTone,
} from "../../shared";

export interface ChangeRequestsMonitoringProps {
  changeRequestMonitoring: any;
  workflowRunMonitoring: any;
  observability: any;
  adminDataLoading: boolean;
  adminDataError: string | null | undefined;
}

export function ChangeRequestsMonitoring({
  changeRequestMonitoring,
  workflowRunMonitoring,
  observability,
  adminDataLoading,
  adminDataError,
}: ChangeRequestsMonitoringProps) {
  return (
    <>
      <div className="mb-3 rounded-md border border-[#5E4A20] bg-[#2B2413] p-2 text-[11px] text-[#FCD34D]">
        <p className="flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          Déploiement requis
        </p>
        <p className="mt-1 text-[#E5E7EB]">
          Une CR peut passer en &quot;implémentée&quot; côté workflow, mais
          les changements code (misfits-web / reimagined-guide) nécessitent
          merge + redémarrage/déploiement des services concernés pour être
          visibles.
        </p>
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-4">
        <div className="rounded-lg border border-[#232327] bg-[#151518] p-2">
          <p className="text-[11px] text-[#A1A1AA]">CR ouvertes</p>
          <p className="text-sm font-semibold text-[#E4E4E7]">
            {asInt(changeRequestMonitoring.total)}
          </p>
        </div>
        <div className="rounded-lg border border-[#232327] bg-[#151518] p-2">
          <p className="text-[11px] text-[#A1A1AA]">En cours</p>
          <p className="text-sm font-semibold text-[#E4E4E7]">
            {asInt(changeRequestMonitoring.wip)}
          </p>
        </div>
        <div className="rounded-lg border border-[#232327] bg-[#151518] p-2">
          <p className="text-[11px] text-[#A1A1AA]">Runs actifs</p>
          <p className="text-sm font-semibold text-[#E4E4E7]">
            {asInt(workflowRunMonitoring.running)}
          </p>
        </div>
        <div className="rounded-lg border border-[#232327] bg-[#151518] p-2">
          <p className="text-[11px] text-[#A1A1AA]">Triage moyen</p>
          <p className="text-sm font-semibold text-[#E4E4E7]">
            {formatDurationMinutes(changeRequestMonitoring.avgTriageMinutes)}
          </p>
        </div>
      </div>

      <div className="mb-3 grid gap-3 xl:grid-cols-3">
        <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
              Console backend (source de vérité)
            </h3>
            <Badge tone={adminDataLoading ? "warn" : "ok"}>
              {adminDataLoading ? "syncing" : "live"}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-[#A1A1AA]">
            Preuves backend de l&apos;activité réelle (queue, débit,
            erreurs), distinctes du simple statut workflow.
          </p>
          <div className="mt-2 grid gap-2 text-[11px] md:grid-cols-3">
            <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#D4D4D8]">
              queue depth:{" "}
              {asInt(observability?.health_realtime?.queue?.depth ?? 0)}
            </div>
            <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#D4D4D8]">
              in/out min:{" "}
              {observability?.health_realtime?.throughput?.incoming_per_min?.toFixed(
                1
              ) ?? "0.0"}
              /
              {observability?.health_realtime?.throughput?.outgoing_per_min?.toFixed(
                1
              ) ?? "0.0"}
            </div>
            <div className="rounded-md border border-[#2A2A30] bg-[#111114] p-2 text-[#D4D4D8]">
              smtp 5xx:{" "}
              {percent(
                observability?.health_realtime?.delivery?.smtp_5xx_rate ?? 0
              )}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-[#A1A1AA]">
            <p>
              success rate:{" "}
              {percent(
                observability?.health_realtime?.delivery?.success_rate ?? 0
              )}{" "}
              · p95:{" "}
              {asInt(
                observability?.health_realtime?.delivery?.p95_total_ms ?? 0
              )}{" "}
              ms
            </p>
            <p>
              alerts queue/auth:{" "}
              {asInt(
                observability?.proactive_alerting?.threshold_alerts
                  ?.queue_growth ?? 0
              )}
              /
              {asInt(
                observability?.proactive_alerting?.threshold_alerts
                  ?.auth_failures ?? 0
              )}
            </p>
            {adminDataError && (
              <p className="mt-1 text-[#FCA5A5]">
                backend indisponible: {adminDataError}
              </p>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
          <p className="text-xs text-[#A1A1AA]">CR totales</p>
          <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
            {asInt(changeRequestMonitoring.total)}
          </p>
          <p className="mt-2 text-xs text-[#A1A1AA]">En cours</p>
          <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
            {asInt(changeRequestMonitoring.wip)}
          </p>
          <p className="mt-2 text-xs text-[#A1A1AA]">Prises en charge</p>
          <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
            {asInt(changeRequestMonitoring.takenCount)}
          </p>
          <p className="mt-2 text-xs text-[#A1A1AA]">
            Délai moyen prise en charge
          </p>
          <p className="mt-1 text-sm font-semibold text-[#E4E4E7]">
            {formatDurationMinutes(
              changeRequestMonitoring.avgTriageMinutes
            )}
          </p>
        </article>
      </div>

      <div className="mb-3 grid gap-3 xl:grid-cols-2">
        <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
          <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
            Dernières prises en charge / transitions
          </h3>
          <div className="mt-2 space-y-2">
            {changeRequestMonitoring.latestEvents.map((event: any) => (
              <div
                key={`${event.requestId}-${event.at}-${event.action}`}
                className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
              >
                <p className="text-xs text-[#E4E4E7]">
                  {event.requestId} · {event.fromStatus} → {event.toStatus}
                </p>
                <p className="text-[11px] text-[#A1A1AA]">
                  {event.actor} · {asDate(event.at)}
                </p>
                {event.note && (
                  <p className="mt-1 text-[11px] text-[#71717A]">
                    {event.note}
                  </p>
                )}
              </div>
            ))}
            {!changeRequestMonitoring.latestEvents.length && (
              <p className="text-xs text-[#71717A]">
                Aucun événement workflow pour le moment.
              </p>
            )}
          </div>
        </article>
        <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
          <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
            État des lieux (CR les plus anciennes)
          </h3>
          <div className="mt-2 space-y-2">
            {changeRequestMonitoring.stalled.map(({ item, ageMinutes }: any) => (
              <div
                key={item.id}
                className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[#E4E4E7]">{item.id}</p>
                  <Badge tone={statusTone(item.status)}>
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-[#A1A1AA]">
                  Inactif depuis {formatDurationMinutes(ageMinutes)}
                </p>
                <p className="mt-1 text-[11px] text-[#71717A]">
                  prise en charge: {item.takenInChargeBy || "—"} ·{" "}
                  {asDate(item.takenInChargeAt || "")}
                </p>
              </div>
            ))}
            {!changeRequestMonitoring.stalled.length && (
              <p className="text-xs text-[#71717A]">
                Aucune CR en attente prolongée.
              </p>
            )}
          </div>
        </article>
      </div>
    </>
  );
}
