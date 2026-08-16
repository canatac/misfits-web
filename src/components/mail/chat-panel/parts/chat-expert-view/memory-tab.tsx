"use client";

import { AlertTriangle, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TaskItem, Analytics } from "./types";

interface Props {
  sessionId: string;
  sessionKey: string;
  folderLabel: string;
  onCopySessionContext: () => void;
  persona: { tone: string; length: string; language: string };
  onPersonaChange: (next: { tone: string; length: string; language: string }) => void;
  memoryNote: string;
  onMemoryNoteChange: (value: string) => void;
  onSaveMemoryNote: () => void;
  onClearMemoryNote: () => void;
  taskItems: TaskItem[];
  onToggleTask: (id: string) => void;
  onExecuteTask: (id: string) => void;
  lastExecError: string | null;
  analytics: Analytics;
  lastLatencyMs: number | null;
  errorCount: number;
}

export function MemoryTab({
  sessionId,
  sessionKey,
  folderLabel,
  onCopySessionContext,
  persona,
  onPersonaChange,
  memoryNote,
  onMemoryNoteChange,
  onSaveMemoryNote,
  onClearMemoryNote,
  taskItems,
  onToggleTask,
  onExecuteTask,
  lastExecError,
  analytics,
  lastLatencyMs,
  errorCount,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-[var(--color-border)] p-3">
        <p className="text-xs font-medium text-[var(--color-muted-fg)]">
          Contexte conversation
        </p>
        <div className="mt-2 space-y-1 text-xs">
          <p>session_id: {sessionId}</p>
          <p>session_key: {sessionKey}</p>
          <p>folder: {folderLabel}</p>
        </div>
        <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={onCopySessionContext}>
          <Copy className="h-3.5 w-3.5" /> Copier le contexte
        </Button>
      </div>

      <div className="rounded-md border border-[var(--color-border)] p-3">
        <p className="text-xs font-medium text-[var(--color-muted-fg)]">
          Persona (persistante)
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          <select
            value={persona.tone}
            onChange={(e) => onPersonaChange({ ...persona, tone: e.target.value })}
            className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
          >
            <option value="neutre">Ton neutre</option>
            <option value="court">Ton court</option>
            <option value="professionnel">Ton pro</option>
            <option value="empathique">Ton empathique</option>
          </select>
          <select
            value={persona.length}
            onChange={(e) => onPersonaChange({ ...persona, length: e.target.value })}
            className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
          >
            <option value="court">Court</option>
            <option value="moyen">Moyen</option>
            <option value="détaillé">Détaillé</option>
          </select>
          <select
            value={persona.language}
            onChange={(e) => onPersonaChange({ ...persona, language: e.target.value })}
            className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border border-[var(--color-border)] p-3">
        <p className="text-xs font-medium text-[var(--color-muted-fg)]">
          Mémoire éditable
        </p>
        <textarea
          value={memoryNote}
          onChange={(e) => onMemoryNoteChange(e.target.value)}
          rows={5}
          className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-1 text-xs"
        />
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={onSaveMemoryNote}>Sauvegarder</Button>
          <Button size="sm" variant="outline" onClick={onClearMemoryNote}>Effacer</Button>
        </div>
      </div>

      <div className="rounded-md border border-[var(--color-border)] p-3">
        <p className="text-xs font-medium text-[var(--color-muted-fg)]">
          TODO exécutables
        </p>
        {taskItems.length === 0 ? (
          <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
            Aucune tâche détectée.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {taskItems.map((task) => (
              <div key={task.id} className="rounded border border-[var(--color-border)] p-2 text-xs">
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => onToggleTask(task.id)}
                    className="mt-0.5"
                  />
                  <span className={task.done ? "text-[var(--color-muted-fg)] line-through" : ""}>
                    {task.text}
                  </span>
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{task.status}</Badge>
                  {task.runId && <Badge variant="secondary">run {task.runId}</Badge>}
                  <Button size="sm" variant="outline" onClick={() => onExecuteTask(task.id)}>
                    Exécuter backend
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {lastExecError && (
          <p className="mt-2 text-xs text-red-500">{lastExecError}</p>
        )}
      </div>

      <div className="rounded-md border border-[var(--color-border)] p-3">
        <p className="text-xs font-medium text-[var(--color-muted-fg)]">Analytics</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <p>requêtes: {analytics.sent}</p>
          <p>latence: {lastLatencyMs ? `${Math.round(lastLatencyMs)}ms` : "n/a"}</p>
          <p>insertions: {analytics.inserts}</p>
          <p>régénérations: {analytics.regenerations}</p>
          <p>stops: {analytics.stops}</p>
          <p>PII redactions: {analytics.redactions}</p>
          <p>feedback 👍: {analytics.feedbackUp}</p>
          <p>feedback 👎: {analytics.feedbackDown}</p>
          <p>tasks backend: {analytics.backendTaskRuns}</p>
        </div>
      </div>

      {errorCount > 0 && (
        <div className="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-xs">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Anomalies détectées</span>
          </div>
          <p className="mt-1">
            Des erreurs d’exécution sont présentes, vérifie les événements.
          </p>
        </div>
      )}
    </div>
  );
}
