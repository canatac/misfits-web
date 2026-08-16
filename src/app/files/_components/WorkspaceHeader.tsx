"use client";

import { RefreshCw } from "lucide-react";
import type { GroupingRule, ScopeRule } from "@/lib/file-workspace";

export function WorkspaceHeader({
  loading,
  onReload,
  grouping,
  onGroupingChange,
  scope,
  onScopeChange,
  emailsCount,
  fileCount,
}: {
  loading: boolean;
  onReload: () => void;
  grouping: GroupingRule;
  onGroupingChange: (g: GroupingRule) => void;
  scope: ScopeRule;
  onScopeChange: (s: ScopeRule) => void;
  emailsCount: number;
  fileCount: number;
}) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">Files Workspace</h1>
          <p className="text-sm text-[#A1A1AA]">
            Explorateur local + workflows de sauvegarde sur la machine du navigateur.
          </p>
        </div>
        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-[#2A2A2D] bg-[#0E0E10] px-3 py-2 text-sm text-[#D4D4D8] hover:bg-[#1A1A1D] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Rafraîchir
        </button>
      </div>

      <div className="mb-4 grid gap-3 rounded-xl border border-[#242427] bg-[#0E0E10] p-3 md:grid-cols-3">
        <label className="text-sm text-[#D4D4D8]">
          Règle de classement
          <select
            value={grouping}
            onChange={(e) => onGroupingChange(e.target.value as GroupingRule)}
            className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-sm"
          >
            <option value="folder">Par dossier mail</option>
            <option value="sender">Par correspondant</option>
            <option value="month">Par mois</option>
            <option value="type">Par type de document</option>
          </select>
        </label>

        <label className="text-sm text-[#D4D4D8]">
          Critère de périmètre
          <select
            value={scope}
            onChange={(e) => onScopeChange(e.target.value as ScopeRule)}
            className="mt-1 w-full rounded border border-[#2A2A2D] bg-[#141417] px-2 py-1.5 text-sm"
          >
            <option value="all">Tous (reçus + envoyés)</option>
            <option value="received">Reçus uniquement</option>
            <option value="sent">Envoyés uniquement</option>
          </select>
        </label>

        <div className="rounded border border-[#242427] bg-[#141417] px-3 py-2 text-sm text-[#A1A1AA]">
          <div>Mails indexés: {emailsCount}</div>
          <div>Documents trouvés: {fileCount}</div>
        </div>
      </div>
    </>
  );
}
