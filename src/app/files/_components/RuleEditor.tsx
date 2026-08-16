"use client";

import { Play, Plus, Trash2 } from "lucide-react";
import { makeRule, type ScopeRule, type WorkflowRule } from "@/lib/file-workspace";

export function RuleEditor({
  rules,
  onChange,
  onRun,
  running,
  status,
}: {
  rules: WorkflowRule[];
  onChange: (updater: (prev: WorkflowRule[]) => WorkflowRule[]) => void;
  onRun: () => void;
  running: boolean;
  status: string;
}) {
  const update = (id: string, patch: Partial<WorkflowRule>) =>
    onChange((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="mb-4 rounded-xl border border-[#242427] bg-[#0E0E10] p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Workflow local (côté navigateur)</h2>
          <p className="text-xs text-[#A1A1AA]">
            Les règles ci-dessous décident quels fichiers sont enregistrés et dans quel sous-dossier local.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange((prev) => [...prev, makeRule({ name: `Workflow ${prev.length + 1}` })])}
          className="inline-flex items-center gap-1 rounded border border-[#2A2A2D] px-2 py-1 text-xs text-[#D4D4D8] hover:bg-[#1A1A1D]"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter règle
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-lg border border-[#242427] bg-[#121214] p-3">
            <div className="mb-2 grid gap-2 md:grid-cols-5">
              <label className="text-xs text-[#A1A1AA]">
                Nom
                <input
                  value={rule.name}
                  onChange={(e) => update(rule.id, { name: e.target.value })}
                  className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                />
              </label>

              <label className="text-xs text-[#A1A1AA]">
                Scope
                <select
                  value={rule.scope}
                  onChange={(e) => update(rule.id, { scope: e.target.value as ScopeRule })}
                  className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs"
                >
                  <option value="all">all</option>
                  <option value="received">received</option>
                  <option value="sent">sent</option>
                </select>
              </label>

              <label className="text-xs text-[#A1A1AA]">
                Sender contains
                <input
                  value={rule.senderContains}
                  onChange={(e) => update(rule.id, { senderContains: e.target.value })}
                  className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                />
              </label>

              <label className="text-xs text-[#A1A1AA]">
                Filename contains
                <input
                  value={rule.filenameIncludes}
                  onChange={(e) => update(rule.id, { filenameIncludes: e.target.value })}
                  className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                />
              </label>

              <label className="text-xs text-[#A1A1AA]">
                Extensions (csv)
                <input
                  value={rule.extensionsCsv}
                  onChange={(e) => update(rule.id, { extensionsCsv: e.target.value })}
                  className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                />
              </label>
            </div>

            <div className="grid gap-2 md:grid-cols-4">
              <label className="text-xs text-[#A1A1AA] md:col-span-2">
                Destination locale (ex: documents/factures/2026)
                <input
                  value={rule.destination}
                  onChange={(e) => update(rule.id, { destination: e.target.value })}
                  className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                />
              </label>

              <label className="text-xs text-[#A1A1AA]">
                Taille max (MB)
                <input
                  type="number"
                  min={1}
                  value={rule.maxSizeMb}
                  onChange={(e) => update(rule.id, { maxSizeMb: Number(e.target.value || 1) })}
                  className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-xs text-[#E4E4E7]"
                />
              </label>

              <div className="flex items-end justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-[#D4D4D8]">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => update(rule.id, { enabled: e.target.checked })}
                  />
                  Active
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-[#D4D4D8]">
                  <input
                    type="checkbox"
                    checked={rule.safeOnly}
                    onChange={(e) => update(rule.id, { safeOnly: e.target.checked })}
                  />
                  Doc sûr
                </label>
                <button
                  type="button"
                  onClick={() =>
                    onChange((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== rule.id)))
                  }
                  className="inline-flex items-center gap-1 rounded border border-[#2A2A2D] px-2 py-1 text-xs text-[#FCA5A5] hover:bg-[#1A1A1D]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Suppr.
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2D] bg-[#141417] px-3 py-2 text-sm text-[#E4E4E7] hover:bg-[#1A1A1D] disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          Exécuter workflow local
        </button>
        <span className="text-xs text-[#A1A1AA]">
          {status || "Choisis un dossier local quand le navigateur te le demande."}
        </span>
      </div>
    </div>
  );
}
