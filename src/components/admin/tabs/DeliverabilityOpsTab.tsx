"use client";

// DeliverabilityOpsTab.tsx — extracted Sprint 3
import type { DeliverabilityProcedureResponse, AdminDeliverabilityDiagnosticsResponse } from "@/types/admin-ops";
import { Badge, asDate, asInt } from "../shared";

interface DeliverabilityOpsTabProps {
  procedureSaving: boolean;
  deliverabilityProcedure: DeliverabilityProcedureResponse | null;
  deliverability: AdminDeliverabilityDiagnosticsResponse | null;
  saveProcedureUpdate: (patch: Partial<DeliverabilityProcedureResponse>) => Promise<void>;
}

export function DeliverabilityOpsTab({
  procedureSaving,
  deliverabilityProcedure,
  deliverability,
  saveProcedureUpdate,
}: DeliverabilityOpsTabProps) {
  return (
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#E4E4E7]">
                Procédure délivrabilité (checklist + automation)
              </h2>
              <p className="mt-1 text-xs text-[#71717A]">
                Pilotage DMARC/SPF/DKIM/Gmail policy avec statuts, rappels et CTAs.
              </p>
            </div>
            <Badge tone={procedureSaving ? "warn" : "ok"}>
              {procedureSaving ? "saving" : deliverabilityProcedure?.overall_status ?? "live"}
            </Badge>
          </div>

          <div className="mb-3 grid gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 text-xs text-[#D4D4D8]">
              <p className="text-[#A1A1AA]">Progression</p>
              <p className="mt-1 text-lg font-semibold text-[#E4E4E7]">
                {asInt(deliverabilityProcedure?.progress?.done ?? 0)} / {asInt(deliverabilityProcedure?.progress?.total ?? 0)}
              </p>
            </article>
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 text-xs text-[#D4D4D8]">
              <p className="text-[#A1A1AA]">Rappel</p>
              <p>
                {deliverabilityProcedure?.reminder?.enabled ? "activé" : "désactivé"} · every {deliverabilityProcedure?.reminder?.cadence_hours ?? 24}h
              </p>
              <p className="mt-1 text-[#71717A]">
                next: {deliverabilityProcedure?.reminder?.next_due_at ? asDate(deliverabilityProcedure.reminder.next_due_at) : "—"}
              </p>
            </article>
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3 text-xs text-[#D4D4D8]">
              <p className="text-[#A1A1AA]">Auto-checks</p>
              <p>
                {(deliverabilityProcedure?.automation?.auto_checks ?? []).join(" · ") || "dns_txt · smtp_events · security_alerts"}
              </p>
            </article>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={procedureSaving}
              onClick={() =>
                void saveProcedureUpdate({
                  reminder: {
                    enabled: !(deliverabilityProcedure?.reminder?.enabled ?? true),
                    cadence_hours: deliverabilityProcedure?.reminder?.cadence_hours ?? 24,
                  },
                })
              }
              className="rounded-lg border border-[#2B2B31] bg-[#151518] px-3 py-1.5 text-xs text-[#D4D4D8] hover:border-[#3A3A42]"
            >
              {deliverabilityProcedure?.reminder?.enabled ? "Désactiver rappel" : "Activer rappel"}
            </button>
            <button
              type="button"
              disabled={procedureSaving}
              onClick={() =>
                void saveProcedureUpdate({
                  reminder: {
                    enabled: deliverabilityProcedure?.reminder?.enabled ?? true,
                    cadence_hours:
                      (deliverabilityProcedure?.reminder?.cadence_hours ?? 24) === 24 ? 48 : 24,
                  },
                })
              }
              className="rounded-lg border border-[#2B2B31] bg-[#151518] px-3 py-1.5 text-xs text-[#D4D4D8] hover:border-[#3A3A42]"
            >
              Basculer cadence 24h/48h
            </button>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                Checklist opérateur
              </h3>
              <div className="mt-3 space-y-2">
                {(deliverabilityProcedure?.checklist ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-[#E4E4E7]">{item.title}</p>
                      <Badge
                        tone={
                          item.status === "done" || item.status === "done_manual"
                            ? "ok"
                            : item.status === "blocked"
                              ? "danger"
                              : "warn"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#A1A1AA]">{item.evidence ?? "—"}</p>
                    {item.operator_note && (
                      <p className="mt-1 text-xs text-[#86EFAC]">note: {item.operator_note}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={procedureSaving}
                        onClick={() =>
                          void saveProcedureUpdate({
                            checklist: [{ id: item.id, checked: true }],
                          })
                        }
                        className="rounded-md border border-[#355D3A] bg-[#132016] px-2 py-1 text-[11px] text-[#86EFAC]"
                      >
                        Marquer fait
                      </button>
                      {item.cta?.details && (
                        <code className="rounded bg-[#1A1A1F] px-2 py-1 text-[11px] text-[#D4D4D8]">
                          {item.cta.details}
                        </code>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-[#232327] bg-[#151518] p-3">
              <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
                CTAs détaillées
              </h3>
              <div className="mt-3 space-y-2 text-xs text-[#D4D4D8]">
                {(deliverabilityProcedure?.cta_details ?? []).map((cta) => (
                  <div
                    key={cta.id}
                    className="rounded-lg border border-[#2A2A30] bg-[#111114] p-2"
                  >
                    <p className="text-sm text-[#E4E4E7]">{cta.label}</p>
                    <p className="mt-1 text-[#A1A1AA]">{cta.description}</p>
                  </div>
                ))}
                {!deliverabilityProcedure?.cta_details?.length && (
                  <p className="text-[#71717A]">Aucune CTA détaillée disponible.</p>
                )}
              </div>
            </article>
          </div>
        </section>
      )}

      {activeTab === "changelog" && (
  );
}
