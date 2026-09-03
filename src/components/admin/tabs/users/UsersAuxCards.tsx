"use client";

// UsersAuxCards.tsx — extracted from UsersTab.tsx Cycle 33 (AI activity + audit log)
import type { UseQueryResult } from "@tanstack/react-query";
import type { AdminAiActivityResponse } from "@/types/admin-ops";
import type { AdminAuditLogResponse } from "@/lib/admin-ops-api";
import { Badge, asDate, asInt, percent } from "../../shared";

function asUsd(value: number | undefined): string {
  const n = Number(value ?? 0);
  return `$${n.toFixed(4)}`;
}

export function UsersAiActivityCard({
  adminAiActivity,
}: {
  adminAiActivity: UseQueryResult<AdminAiActivityResponse, Error>;
}) {
  const metrics = adminAiActivity.data?.metrics;
  const byUser = adminAiActivity.data?.byUser ?? [];
  const byModel = adminAiActivity.data?.byModel ?? [];
  const warnings = adminAiActivity.data?.warnings ?? [];

  return (
    <div className="mb-4 rounded-xl border border-[#232327] bg-[#151518] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-[#A1A1AA]">Activité IA</p>
        <Badge tone={adminAiActivity.isFetching ? "warn" : "ok"}>
          {adminAiActivity.isFetching ? "syncing" : "live"}
        </Badge>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        <p className="text-xs text-[#D4D4D8]">Runs: {asInt(metrics?.totalRuns ?? 0)}</p>
        <p className="text-xs text-[#D4D4D8]">Success: {percent(metrics?.successRate ?? 0)}</p>
        <p className="text-xs text-[#D4D4D8]">Tokens: {asInt(metrics?.totalTokens ?? 0)}</p>
        <p className="text-xs text-[#D4D4D8]">
          Prompt/Completion: {asInt(metrics?.promptTokens ?? 0)} / {asInt(metrics?.completionTokens ?? 0)}
        </p>
        <p className="text-xs text-[#D4D4D8]">
          Latence avg/p95: {asInt(metrics?.avgLatencyMs ?? 0)}ms / {asInt(metrics?.p95LatencyMs ?? 0)}ms
        </p>
        <p className="text-xs text-[#D4D4D8]">
          Coût total: {asUsd(metrics?.totalCostUsd)} {metrics?.currency ?? "USD"}
        </p>
        <p className="text-xs text-[#D4D4D8]">
          Coût moyen/run: {asUsd(metrics?.avgCostPerRunUsd)}
        </p>
        <p className="text-xs text-[#D4D4D8]">
          Runs pricés/non pricés: {asInt(metrics?.pricedRuns ?? 0)} / {asInt(metrics?.unpricedRuns ?? 0)}
        </p>
      </div>

      {!!warnings.length && (
        <div className="mt-2 rounded-md border border-[#5B4A1F] bg-[#2A2513] px-2 py-1">
          {warnings.slice(0, 2).map((w, idx) => (
            <p key={idx} className="text-[11px] text-[#F5C563]">{w}</p>
          ))}
        </div>
      )}

      <div className="mt-3">
        <p className="mb-1 text-xs text-[#A1A1AA]">Répartition par utilisateur</p>
        <div className="space-y-1">
          {byUser.slice(0, 8).map((u) => (
            <p key={u.userId} className="text-[11px] text-[#A1A1AA]">
              {u.userId} · runs={asInt(u.runs)} · tok={asInt(u.totalTokens)} · coût={asUsd(u.totalCostUsd)} · success={percent(u.successRate)}
            </p>
          ))}
          {!byUser.length && (
            <p className="text-[11px] text-[#71717A]">Pas encore de données utilisateur.</p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-xs text-[#A1A1AA]">Répartition par modèle</p>
        <div className="space-y-1">
          {byModel.slice(0, 8).map((m) => (
            <p key={m.model} className="text-[11px] text-[#A1A1AA]">
              {m.model} · runs={asInt(m.runs)} · tok={asInt(m.totalTokens)} · coût={asUsd(m.totalCostUsd)}
            </p>
          ))}
          {!byModel.length && (
            <p className="text-[11px] text-[#71717A]">Pas encore de données modèle.</p>
          )}
        </div>
      </div>

      <div className="mt-2 space-y-1">
        {(adminAiActivity.data?.runs ?? []).slice(0, 6).map((run) => (
          <p key={run.id} className="text-[11px] text-[#A1A1AA]">
            {asDate(run.startedAt || "")} · {run.status} · {run.model} · {run.feature ?? "unknown"} ·
            tok={asInt(run.totalTokens)} · coût={asUsd(run.estimatedCostUsd)} · {asInt(run.latencyMs ?? 0)}ms
          </p>
        ))}
      </div>
    </div>
  );
}

export function UsersAuditLogCard({
  adminAuditLog,
}: {
  adminAuditLog: UseQueryResult<AdminAuditLogResponse, Error>;
}) {
  return (
    <div className="mt-4 rounded-xl border border-[#232327] bg-[#151518] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-[#A1A1AA]">Journal d&apos;audit (100 dernières actions)</p>
        <Badge tone={adminAuditLog.isFetching ? "warn" : "ok"}>
          {adminAuditLog.isFetching ? "syncing" : "live"}
        </Badge>
      </div>
      {adminAuditLog.data?.entries?.length ? (
        <ul className="space-y-1 text-[11px] text-[#D4D4D8]">
          {adminAuditLog.data.entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 rounded-md bg-[#111114] px-2 py-1">
              <span className="min-w-0 truncate">
                <span className="text-[#71717A]">{new Date(entry.at).toLocaleString()}</span>{" "}
                <span className="font-mono text-[#93C5FD]">{entry.actorEmail}</span>{" "}
                →{" "}
                <span className="text-[#F5C563]">{entry.action}</span>{" "}
                <span className="text-[#71717A]">{entry.targetKind}:{entry.targetId}</span>
                {entry.note ? <span className="text-[#A1A1AA]"> · {entry.note}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[#71717A]">Aucune entrée pour le moment.</p>
      )}
      {adminAuditLog.isError && (
        <p className="text-sm text-[#FCA5A5]">Erreur audit-log: {adminAuditLog.error.message}</p>
      )}
    </div>
  );
}
