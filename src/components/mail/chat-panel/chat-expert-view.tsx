"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TaskItem = {
  id: string;
  text: string;
  done: boolean;
  status: "idle" | "running" | "done" | "failed";
  runId?: string;
};

type OpsAction = {
  at: number;
  action: string;
  mode: "dry-run" | "execute";
};

type Analytics = {
  sent: number;
  redactions: number;
  stops: number;
  regenerations: number;
  inserts: number;
  feedbackUp: number;
  feedbackDown: number;
  backendTaskRuns: number;
};

interface TraceEvent {
  id: string;
  at: number;
  kind: string;
  message: string;
  level: "info" | "warn" | "error";
}

interface ChatExpertViewProps {
  traceEvents: TraceEvent[];
  traceStats: { info: number; warn: number; error: number };
  onClearTrace: () => void;
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
  isAdmin: boolean;
  opsDryRun: boolean;
  onToggleOpsDryRun: () => void;
  onRunAdminAction: (action: string, prompt: string) => void;
  opsHistory: OpsAction[];
}

export function ChatExpertView({
  traceEvents,
  traceStats,
  onClearTrace,
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
  isAdmin,
  opsDryRun,
  onToggleOpsDryRun,
  onRunAdminAction,
  opsHistory,
}: ChatExpertViewProps) {
  const [tab, setTab] = useState<"trace" | "memory" | "ops">("trace");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "trace" | "memory" | "ops")} className="flex h-full flex-col">
      <TabsList className={`grid w-full ${isAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
        <TabsTrigger value="trace">Exécution</TabsTrigger>
        <TabsTrigger value="memory">Mémoire</TabsTrigger>
        {isAdmin && <TabsTrigger value="ops">Admin Ops</TabsTrigger>}
      </TabsList>

      <TabsContent value="trace" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-3">
          <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/35 p-3">
            <p className="text-xs font-medium text-[var(--color-muted-fg)]">Statut run</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <Badge variant="secondary">info {traceStats.info}</Badge>
              <Badge variant="warning">warn {traceStats.warn}</Badge>
              <Badge variant="destructive">error {traceStats.error}</Badge>
            </div>
          </div>

          <div className="rounded-md border border-[var(--color-border)] p-2">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-[var(--color-muted-fg)]">Événements</p>
              <button className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]" onClick={onClearTrace}>
                clear
              </button>
            </div>
            {traceEvents.length === 0 ? (
              <p className="text-xs text-[var(--color-muted-fg)]">Aucun événement pour le moment.</p>
            ) : (
              <div className="space-y-1">
                {traceEvents.slice(-80).map((e) => (
                  <div key={e.id} className="text-xs">
                    <span
                      className={
                        e.level === "error"
                          ? "text-red-500"
                          : e.level === "warn"
                            ? "text-amber-500"
                            : "text-[var(--color-muted-fg)]"
                      }
                    >
                      [{new Date(e.at).toLocaleTimeString()}] {e.kind}
                    </span>
                    <span className="ml-2 text-[var(--color-fg)]">{e.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="memory" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-3">
          <div className="rounded-md border border-[var(--color-border)] p-3">
            <p className="text-xs font-medium text-[var(--color-muted-fg)]">Contexte conversation</p>
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
            <p className="text-xs font-medium text-[var(--color-muted-fg)]">Persona (persistante)</p>
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
            <p className="text-xs font-medium text-[var(--color-muted-fg)]">Mémoire éditable</p>
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
            <p className="text-xs font-medium text-[var(--color-muted-fg)]">TODO exécutables</p>
            {taskItems.length === 0 ? (
              <p className="mt-1 text-xs text-[var(--color-muted-fg)]">Aucune tâche détectée.</p>
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
                      <span className={task.done ? "line-through text-[var(--color-muted-fg)]" : ""}>{task.text}</span>
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
            {lastExecError && <p className="mt-2 text-xs text-red-500">{lastExecError}</p>}
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

          {traceStats.error > 0 && (
            <div className="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-xs">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Anomalies détectées</span>
              </div>
              <p className="mt-1">Des erreurs d’exécution sont présentes, vérifie les événements.</p>
            </div>
          )}
        </div>
      </TabsContent>

      {isAdmin && (
        <TabsContent value="ops" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-3">
            <div className="rounded-md border border-[var(--color-border)] p-3">
              <p className="text-xs font-medium text-[var(--color-muted-fg)]">Mode admin RBAC</p>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success-500)]" />
                <span>Utilisateur admin détecté</span>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs">
                <input type="checkbox" checked={opsDryRun} onChange={onToggleOpsDryRun} />
                Dry-run (aucune exécution réelle)
              </label>
            </div>

            <div className="rounded-md border border-[var(--color-border)] p-3">
              <p className="text-xs font-medium text-[var(--color-muted-fg)]">Actions sensibles</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => onRunAdminAction("Créer PR", "Prépare une PR avec plan tests + rollback")}>PR</Button>
                <Button size="sm" variant="outline" onClick={() => onRunAdminAction("Lancer CI", "Prépare la relance CI et vérifications")}>CI</Button>
                <Button size="sm" variant="outline" onClick={() => onRunAdminAction("Deploy", "Prépare le déploiement prod + smoke tests")}>Deploy</Button>
                <Button size="sm" variant="outline" onClick={() => onRunAdminAction("Rollback", "Prépare le rollback + validations post rollback")}>Rollback</Button>
              </div>
            </div>

            <div className="rounded-md border border-[var(--color-border)] p-3">
              <p className="text-xs font-medium text-[var(--color-muted-fg)]">Journal actions</p>
              {opsHistory.length === 0 ? (
                <p className="mt-1 text-xs text-[var(--color-muted-fg)]">Aucune action admin lancée.</p>
              ) : (
                <div className="mt-2 space-y-1 text-xs">
                  {opsHistory.map((entry, idx) => (
                    <div key={`${entry.at}-${idx}`} className="flex items-center justify-between">
                      <span>{new Date(entry.at).toLocaleTimeString()} — {entry.action}</span>
                      <Badge variant="outline">{entry.mode}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}
