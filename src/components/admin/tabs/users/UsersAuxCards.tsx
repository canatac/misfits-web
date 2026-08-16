"use client";

// UsersAuxCards.tsx — extracted from UsersTab.tsx Cycle 33 (AI activity + audit log)
import type { UseQueryResult } from "@tanstack/react-query";
import type { AdminAiActivityResponse } from "@/types/admin-ops";
import type { AdminAuditLogResponse } from "@/lib/admin-ops-api";
import { Badge, asDate, asInt, percent } from "../../shared";

export function UsersAiActivityCard({
  adminAiActivity,
}: {
  adminAiActivity: UseQueryResult<AdminAiActivityResponse, Error>;
}) {
  return (
    <div className="mb-4 rounded-xl border border-[#232327] bg-[#151518] p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-[#A1A1AA]">Activité IA</p>
        <Badge tone={adminAiActivity.isFetching ? "warn" : "ok"}>
          {adminAiActivity.isFetching ? "syncing" : "live"}
        </Badge>
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        <p className="text-xs text-[#D4D4D8]">Runs: {asInt(adminAiActivity.data?.metrics.totalRuns ?? 0)}</p>
        <p className="text-xs text-[#D4D4D8]">Success: {percent(adminAiActivity.data?.metrics.successRate ?? 0)}</p>
        <p className="text-xs text-[#D4D4D8]">Tokens: {asInt(adminAiActivity.data?.metrics.totalTokens ?? 0)}</p>
        <p className="text-xs text-[#D4D4D8]">
          Prompt/Completion:{" "}
          {asInt(adminAiActivity.data?.metrics.promptTokens ?? 0)} /{" "}
          {asInt(adminAiActivity.data?.metrics.completionTokens ?? 0)}
        </p>
        <p className="text-xs text-[#D4D4D8]">
          Latence avg/p95:{" "}
          {asInt(adminAiActivity.data?.metrics.avgLatencyMs ?? 0)}ms /{" "}
          {asInt(adminAiActivity.data?.metrics.p95LatencyMs ?? 0)}ms
        </p>
      </div>
      <div className="mt-2 space-y-1">
        {(adminAiActivity.data?.runs ?? []).slice(0, 6).map((run) => (
          <p key={run.id} className="text-[11px] text-[#A1A1AA]">
            {asDate(run.startedAt || "")} · {run.status} · {run.model} ·
            tok={asInt(run.totalTokens)} · {asInt(run.latencyMs ?? 0)}ms
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
