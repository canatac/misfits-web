"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ListTodo, Send, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { useEmailStore } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useAuthStore } from "@/stores/auth-store";
import { useComposerStore } from "@/stores/composer-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatPanelHeader } from "@/components/mail/chat-panel/chat-panel-header";
import { ChatAssistantView } from "@/components/mail/chat-panel/chat-assistant-view";
import { ChatExpertView } from "@/components/mail/chat-panel/chat-expert-view";
import type { ChatSourceCitation } from "@/types/chat";

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

type PersonaPreset = {
  tone: "neutre" | "court" | "professionnel" | "empathique";
  length: "court" | "moyen" | "détaillé";
  language: "fr" | "en";
};

const QUICK_PROMPTS = [
  "Quels emails importants aujourd'hui ?",
  "Résume ce thread",
  "Trouve les emails sur le budget Q4",
];

const QUICK_ACTIONS = [
  {
    id: "summarize",
    label: "Résumer",
    prompt:
      "Résume cet échange en 5 puces maximum (FR), puis donne niveau d'urgence (faible/moyen/élevé).",
  },
  {
    id: "reply",
    label: "Proposer réponse",
    prompt:
      "Propose une réponse email professionnelle en français: objet suggéré + corps prêt à envoyer.",
  },
  {
    id: "translate",
    label: "Traduire",
    prompt:
      "Traduis le contenu en français clair en gardant le sens exact. Si déjà en français, fournis une version plus concise.",
  },
  {
    id: "todo",
    label: "Extraire TODO",
    prompt:
      "Extrais les TODO/action items: owner suggéré, échéance si détectée, et priorité.",
  },
] as const;

const ROLE_TEMPLATES = [
  {
    id: "sales",
    label: "Sales",
    prompt:
      "Contexte métier: Sales. Priorise impact business, next-step clair et CTA en fin de mail.",
  },
  {
    id: "support",
    label: "Support",
    prompt:
      "Contexte métier: Support client. Réponse empathique, structurée, orientée résolution.",
  },
  {
    id: "legal",
    label: "Legal",
    prompt:
      "Contexte métier: Legal. Réponse prudente, factuelle, sans engagement non validé.",
  },
  {
    id: "exec",
    label: "Exec",
    prompt:
      "Contexte métier: Executive. Résumé ultra-court, décision à prendre, risques/impacts.",
  },
] as const;

const SENSITIVE_KEYWORDS = [
  "deploy",
  "rollback",
  "delete",
  "supprime",
  "production",
  "drop",
  "secret",
  "rotate key",
];

const DEFAULT_PERSONA: PersonaPreset = {
  tone: "professionnel",
  length: "court",
  language: "fr",
};

const DEFAULT_ANALYTICS: Analytics = {
  sent: 0,
  redactions: 0,
  stops: 0,
  regenerations: 0,
  inserts: 0,
  feedbackUp: 0,
  feedbackDown: 0,
  backendTaskRuns: 0,
};

function containsSensitiveIntent(value: string): boolean {
  const lower = value.toLowerCase();
  return SENSITIVE_KEYWORDS.some((k) => lower.includes(k));
}

function parseTaskCandidates(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^(-|\*|\d+\.)\s+/.test(line) || /TODO|action/i.test(line))
    .map((line) => line.replace(/^(-|\*|\d+\.)\s+/, ""))
    .slice(0, 8);
}

function redactPii(input: string): { sanitized: string; count: number } {
  let count = 0;
  const apply = (value: string, pattern: RegExp, replacement: string) =>
    value.replace(pattern, () => {
      count += 1;
      return replacement;
    });

  let out = input;
  out = apply(out, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]");
  out = apply(
    out,
    /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,5}\d{2,4}\b/g,
    "[REDACTED_PHONE]",
  );
  out = apply(out, /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi, "[REDACTED_IBAN]");
  out = apply(out, /\b(?:sk|ghp|ops)_[A-Za-z0-9]{10,}\b/g, "[REDACTED_TOKEN]");

  return { sanitized: out, count };
}

function buildPersonaInstruction(preset: PersonaPreset): string {
  return [
    `Réponds en ${preset.language === "fr" ? "français" : "anglais"}.`,
    `Ton attendu: ${preset.tone}.`,
    `Longueur: ${preset.length}.`,
  ].join(" ");
}

interface ChatPanelProps {
  layout?: "overlay" | "docked";
  className?: string;
  onRequestClose?: () => void;
}

export function ChatPanel({ layout = "overlay", className, onRequestClose }: ChatPanelProps) {
  const {
    isOpen,
    setOpen,
    conversations,
    activeConversationId,
    sendMessage,
    stopStreaming,
    isStreaming,
    createConversation,
    traceEnabled,
    traceEvents,
    setTraceEnabled,
    clearTrace,
    selectConversation,
    lastLatencyMs,
  } = useChatStore();

  const [uiMode, setUiMode] = useState<"assistant" | "expert">("assistant");
  const [workspaceTab, setWorkspaceTab] = useState<"ai" | "agenda" | "tasks">("ai");
  const [input, setInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [pendingSensitivePrompt, setPendingSensitivePrompt] = useState<string | null>(null);
  const [opsDryRun, setOpsDryRun] = useState(true);
  const [opsHistory, setOpsHistory] = useState<OpsAction[]>([]);
  const [memoryNote, setMemoryNote] = useState("");
  const [taskItems, setTaskItems] = useState<TaskItem[]>([]);
  const [templateId, setTemplateId] = useState<string>("none");
  const [persona, setPersona] = useState<PersonaPreset>(DEFAULT_PERSONA);
  const [analytics, setAnalytics] = useState<Analytics>(DEFAULT_ANALYTICS);
  const [lastRedactionCount, setLastRedactionCount] = useState(0);
  const [lastExecError, setLastExecError] = useState<string | null>(null);

  const emails = useEmailStore((s) => s.emails);
  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const selectEmail = useEmailStore((s) => s.selectEmail);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const selectedThreadId = useThreadStore((s) => s.selectedThreadId);
  const selectThread = useThreadStore((s) => s.selectThread);
  const user = useAuthStore((s) => s.user);
  const openComposer = useComposerStore((s) => s.openComposer);

  const active = conversations.find((c) => c.id === activeConversationId) ?? null;
  const isAdmin = user?.role === "admin";
  const selectedEmail = useMemo(
    () => emails.find((e) => e.id === selectedEmailId) ?? null,
    [emails, selectedEmailId],
  );

  const chatContext = useMemo(
    () => ({
      currentEmailId: selectedEmailId ?? undefined,
      currentFolder,
      threadId: selectedThreadId ?? selectedEmailId ?? undefined,
      userId: user?.id ? String(user.id) : undefined,
      attachmentNames: (selectedEmail?.attachments ?? []).slice(0, 8).map((a) => a.filename),
    }),
    [selectedEmailId, currentFolder, selectedThreadId, user?.id, selectedEmail?.attachments],
  );

  const sessionId = chatContext.threadId ? `mail-thread-${chatContext.threadId}` : "(none)";
  const sessionKey = chatContext.userId ? `user-${chatContext.userId}` : "(none)";
  const memoryKey = useMemo(() => `mfa.chat.memory.${sessionKey}`, [sessionKey]);
  const tasksKey = useMemo(() => `mfa.chat.tasks.${sessionKey}`, [sessionKey]);
  const personaKey = useMemo(() => `mfa.chat.persona.${sessionKey}`, [sessionKey]);
  const analyticsKey = useMemo(() => `mfa.chat.analytics.${sessionKey}`, [sessionKey]);

  const traceStats = useMemo(() => {
    const info = traceEvents.filter((e) => e.level === "info").length;
    const warn = traceEvents.filter((e) => e.level === "warn").length;
    const error = traceEvents.filter((e) => e.level === "error").length;
    return { info, warn, error };
  }, [traceEvents]);

  const lastAssistantMessage = useMemo(
    () => [...(active?.messages ?? [])].reverse().find((m) => m.role === "assistant") ?? null,
    [active],
  );
  const lastUserMessage = useMemo(
    () => [...(active?.messages ?? [])].reverse().find((m) => m.role === "user") ?? null,
    [active],
  );

  const agendaEmails = useMemo(
    () =>
      emails
        .filter((e) => /meeting|call|deadline|rdv|agenda|today|tomorrow/i.test(`${e.subject} ${e.preview}`))
        .slice(0, 6),
    [emails],
  );

  const pendingTasks = useMemo(() => taskItems.filter((t) => !t.done).slice(0, 8), [taskItems]);

  useEffect(() => {
    if (!isOpen) return;
    const savedNote = window.localStorage.getItem(memoryKey) ?? "";
    setMemoryNote(savedNote);

    const savedTasks = window.localStorage.getItem(tasksKey);
    if (savedTasks) {
      try {
        setTaskItems(JSON.parse(savedTasks) as TaskItem[]);
      } catch {
        setTaskItems([]);
      }
    } else {
      setTaskItems([]);
    }

    const savedPersona = window.localStorage.getItem(personaKey);
    if (savedPersona) {
      try {
        setPersona(JSON.parse(savedPersona) as PersonaPreset);
      } catch {
        setPersona(DEFAULT_PERSONA);
      }
    }

    const savedAnalytics = window.localStorage.getItem(analyticsKey);
    if (savedAnalytics) {
      try {
        setAnalytics(JSON.parse(savedAnalytics) as Analytics);
      } catch {
        setAnalytics(DEFAULT_ANALYTICS);
      }
    }
  }, [isOpen, memoryKey, tasksKey, personaKey, analyticsKey]);

  if (!isOpen) return null;

  const bumpAnalytics = (patch: Partial<Analytics>) => {
    const next = {
      ...analytics,
      ...Object.fromEntries(
        Object.entries(patch).map(([k, v]) => [
          k,
          ((analytics as Record<string, number>)[k] ?? 0) + (v ?? 0),
        ]),
      ),
    } as Analytics;
    setAnalytics(next);
    window.localStorage.setItem(analyticsKey, JSON.stringify(next));
  };

  const dispatchPrompt = (prompt: string) => {
    const templatePrompt = ROLE_TEMPLATES.find((t) => t.id === templateId)?.prompt;
    const finalPrompt = [buildPersonaInstruction(persona), templatePrompt, prompt]
      .filter(Boolean)
      .join("\n\n");

    if (!active) createConversation();
    bumpAnalytics({ sent: 1 });
    void sendMessage(finalPrompt, chatContext);
  };

  const askForVariant = (tone: "court" | "professionnel" | "empathique") => {
    if (!lastAssistantMessage) return;
    dispatchPrompt(
      `Reformule la dernière proposition en ton ${tone}. Réponse directement exploitable en email.\n\nTexte source:\n${lastAssistantMessage.content}`,
    );
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const redacted = redactPii(input.trim());
    setLastRedactionCount(redacted.count);
    if (redacted.count > 0) bumpAnalytics({ redactions: redacted.count });

    if (containsSensitiveIntent(redacted.sanitized)) {
      setPendingSensitivePrompt(redacted.sanitized);
      return;
    }

    dispatchPrompt(redacted.sanitized);
    setInput("");
  };

  const handleConfirmSensitivePrompt = () => {
    if (!pendingSensitivePrompt) return;
    dispatchPrompt(pendingSensitivePrompt);
    setInput("");
    setPendingSensitivePrompt(null);
  };

  const copySessionContext = async () => {
    const payload = `session_id=${sessionId}\nsession_key=${sessionKey}\nfolder=${chatContext.currentFolder ?? "(none)"}\nattachments=${(chatContext.attachmentNames ?? []).join(", ") || "(none)"}`;
    await navigator.clipboard.writeText(payload);
  };

  const handleInsertToDraft = (content: string) => {
    openComposer({
      subject: "Réponse proposée par Hermes",
      body: `<p>${content.replace(/\n/g, "<br/>")}</p>`,
    });
    bumpAnalytics({ inserts: 1 });
  };

  const insertLatestToDraft = () => {
    if (!lastAssistantMessage?.content) return;
    handleInsertToDraft(lastAssistantMessage.content);
  };

  const handleCreateTasks = (content: string) => {
    const candidates = parseTaskCandidates(content);
    if (candidates.length === 0) return;
    const appended = candidates.map((text) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      done: false,
      status: "idle" as const,
    }));
    const next = [...taskItems, ...appended].slice(-20);
    setTaskItems(next);
    window.localStorage.setItem(tasksKey, JSON.stringify(next));
  };

  const updateTasks = (next: TaskItem[]) => {
    setTaskItems(next);
    window.localStorage.setItem(tasksKey, JSON.stringify(next));
  };

  const toggleTask = (id: string) => {
    const next = taskItems.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    updateTasks(next);
  };

  const executeTaskOnBackend = async (taskId: string) => {
    setLastExecError(null);
    const task = taskItems.find((t) => t.id === taskId);
    if (!task) return;

    updateTasks(taskItems.map((t) => (t.id === taskId ? { ...t, status: "running" } : t)));

    try {
      const modeHint = opsDryRun ? "DRY-RUN" : "EXECUTE";
      const response = await fetch("/api/hermes/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: `[TASK ${modeHint}] ${task.text}\nContexte: session=${sessionId} user=${sessionKey}. Retourne un plan d'exécution court.`,
          model: "hermes-agent",
          threadId: chatContext.threadId,
          userId: chatContext.userId,
          sessionId,
          sessionKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend task run failed (${response.status})`);
      }

      const data = (await response.json().catch(() => ({}))) as {
        run_id?: string;
        id?: string;
      };
      const runId = data.run_id ?? data.id ?? "n/a";
      bumpAnalytics({ backendTaskRuns: 1 });

      updateTasks(
        taskItems.map((t) =>
          t.id === taskId ? { ...t, status: "done", done: true, runId } : t,
        ),
      );
    } catch (err) {
      updateTasks(taskItems.map((t) => (t.id === taskId ? { ...t, status: "failed" } : t)));
      setLastExecError(err instanceof Error ? err.message : "Échec exécution backend");
    }
  };

  const handleSourceClick = (source: ChatSourceCitation) => {
    if (source.kind === "email") {
      selectEmail(source.value);
      return;
    }
    if (source.kind === "thread") {
      selectThread(source.value);
    }
  };

  const handleFeedback = (vote: "up" | "down", reason?: string) => {
    if (vote === "up") bumpAnalytics({ feedbackUp: 1 });
    else bumpAnalytics({ feedbackDown: 1 });

    if (!reason) return;
    const key = `mfa.chat.feedback.${sessionKey}`;
    const raw = window.localStorage.getItem(key);
    const list = raw
      ? (JSON.parse(raw) as Array<{ at: number; vote: string; reason: string }>)
      : [];
    list.unshift({ at: Date.now(), vote, reason: reason.slice(0, 120) });
    window.localStorage.setItem(key, JSON.stringify(list.slice(0, 30)));
  };

  const runAdminAction = (action: string, prompt: string) => {
    const mode: OpsAction["mode"] = opsDryRun ? "dry-run" : "execute";
    setOpsHistory((prev) => [{ at: Date.now(), action, mode }, ...prev].slice(0, 20));
    const finalPrompt = opsDryRun
      ? `[DRY-RUN ADMIN] ${prompt}\n\nNe rien exécuter. Produire un plan + commandes de vérification.`
      : `[ADMIN ACTION] ${prompt}`;
    dispatchPrompt(finalPrompt);
  };

  const stopCurrent = () => {
    if (!isStreaming) return;
    stopStreaming();
    bumpAnalytics({ stops: 1 });
  };

  const regenerate = () => {
    if (!lastUserMessage) return;
    bumpAnalytics({ regenerations: 1 });
    dispatchPrompt(
      `Régénère une meilleure version de la réponse précédente pour ce prompt:\n${lastUserMessage.content}`,
    );
  };

  const confidenceLabel =
    traceStats.error > 0 ? "À vérifier" : isStreaming ? "Génération" : "Prêt";

  const closePanel = () => {
    setOpen(false);
    onRequestClose?.();
  };

  return (
    <div
      className={cn(
        layout === "overlay"
          ? "fixed right-0 top-0 z-50 flex h-screen w-[34rem] max-w-full flex-col border-l border-[#242427] bg-[#0A0A0B] shadow-2xl"
          : "flex h-full w-full flex-col border-l border-[#242427] bg-[#0A0A0B]",
        className,
      )}
    >
      <ChatPanelHeader
        uiMode={uiMode}
        onModeChange={setUiMode}
        onClose={closePanel}
        isStreaming={isStreaming}
        lastLatencyMs={lastLatencyMs}
        traceEnabled={traceEnabled}
        onToggleTrace={() => {
          const next = !traceEnabled;
          setTraceEnabled(next);
          if (!next) clearTrace();
        }}
      />

      <div className="px-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted-fg)]">
          <Badge variant={traceStats.error > 0 ? "destructive" : "secondary"}>{confidenceLabel}</Badge>
          {uiMode === "assistant" ? (
            <span>
              {selectedEmail?.subject
                ? `Contexte: ${selectedEmail.subject.slice(0, 72)}`
                : "Contexte: conversation courante"}
            </span>
          ) : (
            <span>{`session=${sessionId} · user=${sessionKey}`}</span>
          )}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-[#242427] bg-[#121214] p-1 text-[11px]">
          <button
            type="button"
            onClick={() => setWorkspaceTab("ai")}
            className={cn(
              "rounded-lg px-2 py-1.5 font-medium transition",
              workspaceTab === "ai" ? "bg-[#1D1D20] text-[#C49B66]" : "text-[#71717A] hover:text-white",
            )}
          >
            IA
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceTab("agenda")}
            className={cn(
              "rounded-lg px-2 py-1.5 font-medium transition",
              workspaceTab === "agenda" ? "bg-[#1D1D20] text-[#C49B66]" : "text-[#71717A] hover:text-white",
            )}
          >
            Agenda
          </button>
          <button
            type="button"
            onClick={() => setWorkspaceTab("tasks")}
            className={cn(
              "rounded-lg px-2 py-1.5 font-medium transition",
              workspaceTab === "tasks" ? "bg-[#1D1D20] text-[#C49B66]" : "text-[#71717A] hover:text-white",
            )}
          >
            Tâches
          </button>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
          <div className="rounded-lg border border-[#242427] bg-[#121214] px-2 py-1.5">
            <div className="text-[#71717A]">Conversations</div>
            <div className="font-mono text-[#E0E0E0]">{conversations.length}</div>
          </div>
          <div className="rounded-lg border border-[#242427] bg-[#121214] px-2 py-1.5">
            <div className="text-[#71717A]">Agenda détecté</div>
            <div className="font-mono text-[#E0E0E0]">{agendaEmails.length}</div>
          </div>
          <div className="rounded-lg border border-[#242427] bg-[#121214] px-2 py-1.5">
            <div className="text-[#71717A]">TODO actifs</div>
            <div className="font-mono text-[#E0E0E0]">{pendingTasks.length}</div>
          </div>
        </div>
      </div>

      {pendingSensitivePrompt && (
        <div className="mx-3 mt-3 rounded-md border border-amber-400/50 bg-amber-500/10 p-2 text-xs">
          <div className="flex items-center gap-2 text-amber-600">
            <ShieldAlert className="h-4 w-4" />
            <span className="font-medium">Action sensible détectée</span>
          </div>
          <p className="mt-1">Confirmation requise avant envoi du prompt.</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={handleConfirmSensitivePrompt}>
              Confirmer
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPendingSensitivePrompt(null)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {lastRedactionCount > 0 && (
        <div className="mx-3 mt-2 rounded border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-2 py-1 text-[11px] text-[var(--color-muted-fg)]">
          PII masquée avant envoi: {lastRedactionCount} élément(s)
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden p-3">
        {workspaceTab === "ai" ? (
          uiMode === "assistant" ? (
            <ChatAssistantView
              conversations={conversations}
              activeConversationId={activeConversationId}
              activeConversation={active}
              lastAssistantMessage={lastAssistantMessage}
              lastUserMessage={lastUserMessage}
              isStreaming={isStreaming}
              searchValue={searchValue}
              onSearchValueChange={setSearchValue}
              templateId={templateId}
              onTemplateIdChange={setTemplateId}
              roleTemplates={ROLE_TEMPLATES.map((t) => ({ id: t.id, label: `Template: ${t.label}` }))}
              quickPrompts={QUICK_PROMPTS}
              quickActions={QUICK_ACTIONS.map((a) => ({ id: a.id, label: a.label, prompt: a.prompt }))}
              onSelectConversation={selectConversation}
              onDispatchPrompt={dispatchPrompt}
              onInsertToDraft={handleInsertToDraft}
              onCreateTasks={handleCreateTasks}
              onSourceClick={handleSourceClick}
              onFeedback={handleFeedback}
              onAskVariant={askForVariant}
              onRegenerate={regenerate}
              onStop={stopCurrent}
            />
          ) : (
            <ChatExpertView
              traceEvents={traceEvents}
              traceStats={traceStats}
              onClearTrace={clearTrace}
              sessionId={sessionId}
              sessionKey={sessionKey}
              folderLabel={chatContext.currentFolder ?? "(none)"}
              onCopySessionContext={() => void copySessionContext()}
              persona={persona}
              onPersonaChange={(next) => {
                const updated = {
                  tone: next.tone as PersonaPreset["tone"],
                  length: next.length as PersonaPreset["length"],
                  language: next.language as PersonaPreset["language"],
                };
                setPersona(updated);
                window.localStorage.setItem(personaKey, JSON.stringify(updated));
              }}
              memoryNote={memoryNote}
              onMemoryNoteChange={setMemoryNote}
              onSaveMemoryNote={() => window.localStorage.setItem(memoryKey, memoryNote)}
              onClearMemoryNote={() => {
                setMemoryNote("");
                window.localStorage.removeItem(memoryKey);
              }}
              taskItems={taskItems}
              onToggleTask={toggleTask}
              onExecuteTask={(id) => void executeTaskOnBackend(id)}
              lastExecError={lastExecError}
              analytics={analytics}
              lastLatencyMs={lastLatencyMs}
              isAdmin={isAdmin}
              opsDryRun={opsDryRun}
              onToggleOpsDryRun={() => setOpsDryRun((v) => !v)}
              onRunAdminAction={runAdminAction}
              opsHistory={opsHistory}
            />
          )
        ) : workspaceTab === "agenda" ? (
          <div className="h-full overflow-auto rounded-xl border border-[#242427] bg-[#121214] p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#E0E0E0]">
              <CalendarClock className="h-4 w-4 text-[#C49B66]" />
              Agenda prioritaire
            </div>
            <div className="space-y-2">
              {agendaEmails.length === 0 ? (
                <p className="text-xs text-[#71717A]">Aucun email agenda détecté.</p>
              ) : (
                agendaEmails.map((email) => (
                  <button
                    key={email.id}
                    type="button"
                    onClick={() => selectEmail(email.id)}
                    className="w-full rounded-lg border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-left hover:border-[#C49B66]/50"
                  >
                    <div className="text-xs font-medium text-[#E0E0E0]">{email.subject}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-[#71717A]">{email.preview}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-auto rounded-xl border border-[#242427] bg-[#121214] p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#E0E0E0]">
              <ListTodo className="h-4 w-4 text-[#C49B66]" />
              Tâches Hermes
            </div>
            <div className="space-y-2">
              {pendingTasks.length === 0 ? (
                <p className="text-xs text-[#71717A]">Aucune tâche en attente.</p>
              ) : (
                pendingTasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-start gap-2 rounded-lg border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-xs text-[#D4D4D8]"
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                      className="mt-0.5"
                    />
                    <span className="flex-1">{task.text}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-[#242427] bg-[#121214] p-3">
        <div className="mb-2 flex items-center gap-2">
          <Button onClick={insertLatestToDraft} disabled={!lastAssistantMessage?.content} className="flex-1">
            Action principale: Insérer la dernière réponse dans le brouillon
          </Button>
          <Button variant="outline" onClick={regenerate} disabled={!lastUserMessage || isStreaming}>
            Régénérer
          </Button>
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Demander à Hermes..."
            className="flex-1 rounded-xl border border-[#242427] bg-[#0A0A0B] px-3 py-2 text-sm text-white placeholder-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#C49B66]"
          />
          <Button size="icon" onClick={handleSend} disabled={isStreaming || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
