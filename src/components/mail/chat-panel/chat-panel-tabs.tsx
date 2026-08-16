"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WorkspaceTab } from "./use-chat-panel-state";

interface ChatPanelTabsProps {
  confidenceLabel: string;
  hasErrors: boolean;
  uiMode: "assistant" | "expert";
  selectedEmailSubject?: string;
  sessionId: string;
  sessionKey: string;
  workspaceTab: WorkspaceTab;
  onWorkspaceTabChange: (tab: WorkspaceTab) => void;
  conversationsCount: number;
  agendaCount: number;
  pendingTasksCount: number;
}

const TABS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: "ai", label: "IA" },
  { id: "agenda", label: "Agenda" },
  { id: "tasks", label: "Tâches" },
];

export function ChatPanelTabs({
  confidenceLabel,
  hasErrors,
  uiMode,
  selectedEmailSubject,
  sessionId,
  sessionKey,
  workspaceTab,
  onWorkspaceTabChange,
  conversationsCount,
  agendaCount,
  pendingTasksCount,
}: ChatPanelTabsProps) {
  return (
    <div className="px-3 pt-2">
      <div className="flex items-center gap-2 text-xs text-[var(--color-muted-fg)]">
        <Badge variant={hasErrors ? "destructive" : "secondary"}>
          {confidenceLabel}
        </Badge>
        {uiMode === "assistant" ? (
          <span>
            {selectedEmailSubject
              ? `Contexte: ${selectedEmailSubject.slice(0, 72)}`
              : "Contexte: conversation courante"}
          </span>
        ) : (
          <span>{`session=${sessionId} · user=${sessionKey}`}</span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-[#242427] bg-[#121214] p-1 text-[11px]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onWorkspaceTabChange(tab.id)}
            className={cn(
              "rounded-lg px-2 py-1.5 font-medium transition",
              workspaceTab === tab.id
                ? "bg-[#1D1D20] text-[#C49B66]"
                : "text-[#71717A] hover:text-white"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
        <StatCell label="Conversations" value={conversationsCount} />
        <StatCell label="Agenda détecté" value={agendaCount} />
        <StatCell label="TODO actifs" value={pendingTasksCount} />
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#242427] bg-[#121214] px-2 py-1.5">
      <div className="text-[#71717A]">{label}</div>
      <div className="font-mono text-[#E0E0E0]">{value}</div>
    </div>
  );
}
