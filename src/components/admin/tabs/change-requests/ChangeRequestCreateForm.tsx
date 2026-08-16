"use client";
import React from "react";
import type { CreateChangeRequestInput } from "@/types/admin-ops";
import { cn } from "@/lib/utils";
import { Badge } from "../../shared";

export interface ChangeRequestCreateFormProps {
  newRequest: any;
  setNewRequest: (updater: (prev: any) => any) => void;
  createChangeRequest: any;
  qualityChecks: any;
  crGuideMessages: any[];
  crGuideInput: string;
  crGuideLoading: boolean;
  crGuideError: string | null | undefined;
  handleCreateChangeRequest: (e: React.FormEvent) => void;
  handleGuideChatSubmit: (e: React.FormEvent) => void;
  applyGuideToForm: () => void;
  setCrGuideInput: (v: string) => void;
}

export function ChangeRequestCreateForm({
  newRequest,
  setNewRequest,
  createChangeRequest,
  qualityChecks,
  crGuideMessages,
  crGuideInput,
  crGuideLoading,
  crGuideError,
  handleCreateChangeRequest,
  handleGuideChatSubmit,
  applyGuideToForm,
  setCrGuideInput,
}: ChangeRequestCreateFormProps) {
  return (
    <div className="grid gap-3 xl:grid-cols-5">
      <form
        onSubmit={handleCreateChangeRequest}
        className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-3"
      >
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
          Nouvelle demande
        </h3>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            value={newRequest.title}
            onChange={(e) =>
              setNewRequest((prev: any) => ({
                ...prev,
                title: e.target.value
              }))
            }
            className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
            placeholder="Titre (ex: Flux changelog + CR admin)"
            required
            minLength={8}
          />
          <input
            value={newRequest.requestedBy}
            onChange={(e) =>
              setNewRequest((prev: any) => ({
                ...prev,
                requestedBy: e.target.value
              }))
            }
            className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
            placeholder="Requested by"
            required
          />
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <select
            value={newRequest.scope}
            onChange={(e) =>
              setNewRequest((prev: any) => ({
                ...prev,
                scope: e.target
                  .value as CreateChangeRequestInput["scope"]
              }))
            }
            className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
          >
            <option value="ux">Scope UX</option>
            <option value="backend">Scope Backend</option>
            <option value="fullstack">Scope Fullstack</option>
            <option value="security">Scope Security</option>
          </select>
          <select
            value={newRequest.urgency}
            onChange={(e) =>
              setNewRequest((prev: any) => ({
                ...prev,
                urgency: e.target
                  .value as CreateChangeRequestInput["urgency"]
              }))
            }
            className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
          >
            <option value="low">Urgence low</option>
            <option value="medium">Urgence medium</option>
            <option value="high">Urgence high</option>
          </select>
          <select
            value={newRequest.impact}
            onChange={(e) =>
              setNewRequest((prev: any) => ({
                ...prev,
                impact: e.target
                  .value as CreateChangeRequestInput["impact"]
              }))
            }
            className="rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
          >
            <option value="small">Impact small</option>
            <option value="medium">Impact medium</option>
            <option value="high">Impact high</option>
          </select>
        </div>
        <div className="mt-2">
          <select
            value={newRequest.linkedRepo}
            onChange={(e) =>
              setNewRequest((prev: any) => ({
                ...prev,
                linkedRepo: e.target
                  .value as CreateChangeRequestInput["linkedRepo"]
              }))
            }
            className="w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#D4D4D8]"
          >
            <option value="misfits-web">Repo: misfits-web</option>
            <option value="reimagined-guide">
              Repo: reimagined-guide
            </option>
            <option value="cross-repo">Repo: cross-repo</option>
          </select>
        </div>
        <textarea
          value={newRequest.problem}
          onChange={(e) =>
            setNewRequest((prev: any) => ({
              ...prev,
              problem: e.target.value
            }))
          }
          className="mt-2 h-20 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
          placeholder="Problème à résoudre"
          minLength={16}
          required
        />
        <textarea
          value={newRequest.desiredOutcome}
          onChange={(e) =>
            setNewRequest((prev: any) => ({
              ...prev,
              desiredOutcome: e.target.value
            }))
          }
          className="mt-2 h-20 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2.5 py-2 text-sm text-[#E4E4E7]"
          placeholder="Résultat attendu + critères de succès"
          minLength={16}
          required
        />
        <button
          type="submit"
          className="mt-2 rounded-lg border border-[#C49B66] bg-[#2A2218] px-3 py-1.5 text-xs font-semibold text-[#F2D5A7] disabled:opacity-50"
          disabled={
            createChangeRequest.isPending || qualityChecks.score < 4
          }
        >
          {createChangeRequest.isPending
            ? "Création..."
            : "Créer et lancer le workflow"}
        </button>
        {qualityChecks.score < 4 && (
          <p className="mt-2 text-xs text-[#FCD34D]">
            Complète au moins 4/5 critères qualité via l&apos;assistant
            chat avant soumission.
          </p>
        )}
      </form>

      <aside className="rounded-xl border border-[#232327] bg-[#151518] p-3 xl:col-span-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold tracking-wide text-[#D4D4D8] uppercase">
            Assistant chat — formulation CR
          </h3>
          <Badge tone={qualityChecks.score >= 4 ? "ok" : "warn"}>
            qualité {qualityChecks.score}/5
          </Badge>
        </div>
        <p className="text-xs text-[#A1A1AA]">
          Discute avec Hermes pour structurer la demande. Il reformule et
          alimente automatiquement le formulaire.
        </p>

        <div className="mt-3 h-64 space-y-2 overflow-y-auto rounded-lg border border-[#2A2A30] bg-[#111114] p-2">
          {crGuideMessages.map((message: any, index: number) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                "max-w-[92%] rounded-md px-2 py-1.5 text-xs leading-relaxed",
                message.role === "assistant"
                  ? "border border-[#2A2A30] bg-[#151518] text-[#D4D4D8]"
                  : "ml-auto border border-[#4A3921] bg-[#2A2218] text-[#F2D5A7]"
              )}
            >
              {message.content}
            </div>
          ))}
        </div>

        <form className="mt-2 space-y-2" onSubmit={handleGuideChatSubmit}>
          <textarea
            value={crGuideInput}
            onChange={(e) => setCrGuideInput(e.target.value)}
            className="h-20 w-full rounded-lg border border-[#2A2A30] bg-[#111114] px-2 py-1.5 text-xs text-[#E4E4E7]"
            placeholder="Réponds au message Hermes (ex: impact, KPI, rollback, etc.)"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={crGuideLoading || !crGuideInput.trim()}
              className="rounded-lg border border-[#C49B66] bg-[#2A2218] px-2.5 py-1.5 text-xs font-semibold text-[#F2D5A7] disabled:opacity-50"
            >
              {crGuideLoading ? "Hermes rédige…" : "Envoyer"}
            </button>
            <button
              type="button"
              onClick={() => applyGuideToForm()}
              className="rounded-lg border border-[#3A3A42] px-2.5 py-1.5 text-xs text-[#D4D4D8]"
            >
              Appliquer au formulaire
            </button>
          </div>
          {crGuideError && (
            <p className="text-xs text-[#FCA5A5]">
              Assistant indisponible: {crGuideError}
            </p>
          )}
        </form>

        <div className="mt-3 rounded-lg border border-[#2A2A30] bg-[#111114] p-2">
          <p className="mb-1 text-[11px] text-[#A1A1AA]">
            Checklist qualité
          </p>
          <div className="space-y-1">
            {qualityChecks.checks.map((check: any) => (
              <p
                key={check.label}
                className={cn(
                  "text-xs",
                  check.ok ? "text-[#86EFAC]" : "text-[#FCD34D]"
                )}
              >
                {check.ok ? "✓" : "•"} {check.label}
              </p>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
