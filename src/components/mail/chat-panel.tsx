"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useEmailStore } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useAuthStore } from "@/stores/auth-store";
import { useComposerStore } from "@/stores/composer-store";
import { ChatMessageBubble } from "@/components/mail/chat-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Rocket,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Square,
  X,
} from "lucide-react";
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
  out = apply(out, /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,5}\d{2,4}\b/g, "[REDACTED_PHONE]");
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

export function ChatPanel() {
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

  const [input, setInput] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState<"assistant" | "trace" | "memory" | "ops">(
    "assistant",
  );
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

  const scrollRef = useRef<HTMLDivElement>(null);

  const emails = useEmailStore((s) => s.emails);
  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const selectEmail = useEmailStore((s) => s.selectEmail);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const selectedThreadId = useThreadStore((s) => s.selectedThreadId);
  const selectThread = useThreadStore((s) => s.selectThread);
  const user = useAuthStore((s) => s.user);
  const openComposer = useComposerStore((s) => s.openComposer);

  const active = conversations.find((c) => c.id === activeConversationId);
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

  const confidence = useMemo(() => {
    if (traceStats.error > 0) return "À vérifier";
    if (traceEvents.some((e) => e.kind === "run.completed")) return "Élevée";
    if (isStreaming) return "Calcul";
    return "Normale";
  }, [traceStats.error, traceEvents, isStreaming]);

  const filteredConversations = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      if (conv.title.toLowerCase().includes(q)) return true;
      return conv.messages.some((m) => m.content.toLowerCase().includes(q));
    });
  }, [conversations, searchValue]);

  const lastAssistantMessage = useMemo(() => {
    if (!active) return null;
    return [...active.messages].reverse().find((m) => m.role === "assistant") ?? null;
  }, [active]);

  const lastUserMessage = useMemo(() => {
    if (!active) return null;
    return [...active.messages].reverse().find((m) => m.role === "user") ?? null;
  }, [active]);

  const livingSummary = useMemo(() => {
    if (!lastAssistantMessage?.content) return "Aucun résumé disponible.";
    return lastAssistantMessage.content.slice(0, 240);
  }, [lastAssistantMessage]);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages.length, isStreaming, traceEvents.length, activeTab, taskItems.length]);

  if (!isOpen) return null;

  const bumpAnalytics = (patch: Partial<Analytics>) => {
    const next = { ...analytics, ...Object.fromEntries(
      Object.entries(patch).map(([k, v]) => [k, ((analytics as Record<string, number>)[k] ?? 0) + (v ?? 0)]),
    ) } as Analytics;
    setAnalytics(next);
    window.localStorage.setItem(analyticsKey, JSON.stringify(next));
  };

  const dispatchPrompt = (prompt: string) => {
    const templatePrompt = ROLE_TEMPLATES.find((t) => t.id === templateId)?.prompt;
    const finalPrompt = [
      buildPersonaInstruction(persona),
      templatePrompt,
      prompt,
    ]
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

      const data = (await response.json().catch(() => ({}))) as { run_id?: string; id?: string };
      const runId = data.run_id ?? data.id ?? "n/a";
      bumpAnalytics({ backendTaskRuns: 1 });

      updateTasks(
        taskItems.map((t) =>
          t.id === taskId
            ? { ...t, status: "done", done: true, runId }
            : t,
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
    const list = raw ? (JSON.parse(raw) as Array<{ at: number; vote: string; reason: string }>) : [];
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
    dispatchPrompt(`Régénère une meilleure version de la réponse précédente pour ce prompt:\n${lastUserMessage.content}`);
  };

  const saveMemoryNote = () => {
    window.localStorage.setItem(memoryKey, memoryNote);
  };

  const savePersona = (next: PersonaPreset) => {
    setPersona(next);
    window.localStorage.setItem(personaKey, JSON.stringify(next));
  };

  return (
    <div className="fixed right-0 top-0 z-50 flex h-screen w-[34rem] max-w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl">
      <div className="border-b border-[var(--color-border)] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-brand-500)]" />
            <span className="text-sm font-semibold">Mail Assistant</span>
            <Badge variant="secondary" className="text-[10px]">v2 top10</Badge>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !traceEnabled;
                setTraceEnabled(next);
                if (!next) clearTrace();
              }}
              className={`rounded border px-2 py-1 text-xs ${
                traceEnabled
                  ? "border-[var(--color-brand-500)] text-[var(--color-brand-500)]"
                  : "border-[var(--color-border)] text-[var(--color-muted-fg)]"
              }`}
              title="Afficher les détails d'exécution"
            >
              Trace {traceEnabled ? "on" : "off"}
            </button>
            <button onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={traceStats.error > 0 ? "destructive" : "success"}>{confidence}</Badge>
          <Badge variant="outline">Session: {sessionId}</Badge>
          <Badge variant="outline">User: {sessionKey}</Badge>
          {lastLatencyMs !== null && <Badge variant="outline">latence {Math.round(lastLatencyMs)}ms</Badge>}
        </div>

        <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-2">
          <p className="text-[11px] font-medium text-[var(--color-muted-fg)]">Résumé vivant du thread</p>
          <p className="mt-1 text-xs">{livingSummary}</p>
          {!!chatContext.attachmentNames?.length && (
            <p className="mt-1 text-[11px] text-[var(--color-muted-fg)]">
              Attachments contexte: {chatContext.attachmentNames.join(", ")}
            </p>
          )}
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
            <Button size="sm" onClick={handleConfirmSensitivePrompt}>Confirmer</Button>
            <Button size="sm" variant="outline" onClick={() => setPendingSensitivePrompt(null)}>Annuler</Button>
          </div>
        </div>
      )}

      {lastRedactionCount > 0 && (
        <div className="mx-3 mt-2 rounded border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-2 py-1 text-[11px] text-[var(--color-muted-fg)]">
          PII masquée avant envoi: {lastRedactionCount} élément(s)
        </div>
      )}

      <div className="flex-1 overflow-hidden p-3">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "assistant" | "trace" | "memory" | "ops")}
          className="flex h-full flex-col"
        >
          <TabsList className={`grid w-full ${isAdmin ? "grid-cols-4" : "grid-cols-3"}`}>
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
            <TabsTrigger value="trace">Exécution</TabsTrigger>
            <TabsTrigger value="memory">Mémoire</TabsTrigger>
            {isAdmin && <TabsTrigger value="ops">Admin Ops</TabsTrigger>}
          </TabsList>

          <TabsContent value="assistant" className="mt-3 flex-1 overflow-hidden">
            <div className="mb-2 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[var(--color-muted-fg)]" />
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Rechercher dans l'historique IA"
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2"
                >
                  <option value="none">Template: aucun</option>
                  {ROLE_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>Template: {tpl.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
              {filteredConversations.slice(0, 8).map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`rounded-full border px-2 py-1 text-[11px] ${
                    conv.id === activeConversationId
                      ? "border-[var(--color-brand-500)] text-[var(--color-brand-500)]"
                      : "border-[var(--color-border)] text-[var(--color-muted-fg)]"
                  }`}
                >
                  {conv.title}
                </button>
              ))}
            </div>

            <div ref={scrollRef} className="h-[calc(100%-9rem)] space-y-3 overflow-y-auto pr-1">
              {(!active || active.messages.length === 0) && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Sparkles className="h-10 w-10 text-[var(--color-brand-500)]" />
                  <p className="text-sm text-[var(--color-muted-fg)]">
                    Assistant mail contextuel. Choisis une action rapide ou pose ta question.
                  </p>
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => dispatchPrompt(p)}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-[var(--color-muted)]"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {active?.messages.map((msg, i) => (
                <ChatMessageBubble
                  key={i}
                  message={msg}
                  onInsertToDraft={msg.role === "assistant" ? handleInsertToDraft : undefined}
                  onCreateTasks={msg.role === "assistant" ? handleCreateTasks : undefined}
                  onSourceClick={msg.role === "assistant" ? handleSourceClick : undefined}
                  onFeedback={msg.role === "assistant" ? handleFeedback : undefined}
                />
              ))}

              {isStreaming && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-fg)]">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  {traceEnabled ? "Streaming Hermes en cours..." : "Génération en temps réel..."}
                </div>
              )}
            </div>

            <div className="mt-2 rounded-md border border-[var(--color-border)] p-2">
              <p className="text-[11px] font-medium text-[var(--color-muted-fg)]">Variantes ton</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => askForVariant("court")} disabled={!lastAssistantMessage}>A court</Button>
                <Button size="sm" variant="outline" onClick={() => askForVariant("professionnel")} disabled={!lastAssistantMessage}>B pro</Button>
                <Button size="sm" variant="outline" onClick={() => askForVariant("empathique")} disabled={!lastAssistantMessage}>C empathique</Button>
                <Button size="sm" variant="outline" onClick={regenerate} disabled={!lastUserMessage || isStreaming}>Regenerate</Button>
                <Button size="sm" variant="destructive" onClick={stopCurrent} disabled={!isStreaming}>
                  <Square className="mr-1 h-3 w-3" /> Stop
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trace" className="mt-3 flex-1 overflow-hidden">
            <div ref={scrollRef} className="h-full space-y-3 overflow-y-auto pr-1">
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
                  <button
                    className="text-xs text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                    onClick={clearTrace}
                  >
                    clear
                  </button>
                </div>
                {traceEvents.length === 0 ? (
                  <p className="text-xs text-[var(--color-muted-fg)]">
                    Aucun événement pour le moment. Active « Trace on » puis lance une requête.
                  </p>
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

          <TabsContent value="memory" className="mt-3 flex-1 overflow-hidden">
            <div className="h-full space-y-3 overflow-y-auto pr-1">
              <div className="rounded-md border border-[var(--color-border)] p-3">
                <p className="text-xs font-medium text-[var(--color-muted-fg)]">Contexte conversation</p>
                <div className="mt-2 space-y-1 text-xs">
                  <p><span className="text-[var(--color-muted-fg)]">session_id:</span> {sessionId}</p>
                  <p><span className="text-[var(--color-muted-fg)]">session_key:</span> {sessionKey}</p>
                  <p><span className="text-[var(--color-muted-fg)]">folder:</span> {chatContext.currentFolder ?? "(none)"}</p>
                </div>
                <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => void copySessionContext()}>
                  <Copy className="h-3.5 w-3.5" /> Copier le contexte
                </Button>
              </div>

              <div className="rounded-md border border-[var(--color-border)] p-3">
                <p className="text-xs font-medium text-[var(--color-muted-fg)]">Persona (persistant)</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <select
                    value={persona.tone}
                    onChange={(e) => savePersona({ ...persona, tone: e.target.value as PersonaPreset["tone"] })}
                    className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
                  >
                    <option value="neutre">Ton neutre</option>
                    <option value="court">Ton court</option>
                    <option value="professionnel">Ton pro</option>
                    <option value="empathique">Ton empathique</option>
                  </select>
                  <select
                    value={persona.length}
                    onChange={(e) => savePersona({ ...persona, length: e.target.value as PersonaPreset["length"] })}
                    className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
                  >
                    <option value="court">Court</option>
                    <option value="moyen">Moyen</option>
                    <option value="détaillé">Détaillé</option>
                  </select>
                  <select
                    value={persona.language}
                    onChange={(e) => savePersona({ ...persona, language: e.target.value as PersonaPreset["language"] })}
                    className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="rounded-md border border-[var(--color-border)] p-3">
                <p className="text-xs font-medium text-[var(--color-muted-fg)]">Mémoire éditable (utilisateur)</p>
                <textarea
                  value={memoryNote}
                  onChange={(e) => setMemoryNote(e.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-1 text-xs"
                  placeholder="Préférences, contexte métier, contraintes de réponse…"
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={saveMemoryNote}>Sauvegarder</Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setMemoryNote("");
                      window.localStorage.removeItem(memoryKey);
                    }}
                  >
                    Effacer
                  </Button>
                </div>
              </div>

              <div className="rounded-md border border-[var(--color-border)] p-3">
                <p className="text-xs font-medium text-[var(--color-muted-fg)]">TODO exécutables (backend)</p>
                {taskItems.length === 0 ? (
                  <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
                    Utilise « Créer tâches » depuis une réponse assistant pour remplir cette liste.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {taskItems.map((task) => (
                      <div key={task.id} className="rounded border border-[var(--color-border)] p-2 text-xs">
                        <label className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => toggleTask(task.id)}
                            className="mt-0.5"
                          />
                          <span className={task.done ? "line-through text-[var(--color-muted-fg)]" : ""}>{task.text}</span>
                        </label>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline">{task.status}</Badge>
                          {task.runId && <Badge variant="secondary">run {task.runId}</Badge>}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={task.status === "running"}
                            onClick={() => void executeTaskOnBackend(task.id)}
                          >
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
                <p className="text-xs font-medium text-[var(--color-muted-fg)]">Analytics qualité assistant</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <p>requêtes: {analytics.sent}</p>
                  <p>latence dernière: {lastLatencyMs ? `${Math.round(lastLatencyMs)}ms` : "n/a"}</p>
                  <p>insertions brouillon: {analytics.inserts}</p>
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
                  <p className="mt-1 text-[var(--color-fg)]">
                    Des erreurs d’exécution sont présentes dans l’onglet Exécution. Vérifie
                    les événements avant de réutiliser la réponse telle quelle.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="ops" className="mt-3 flex-1 overflow-hidden">
              <div className="h-full space-y-3 overflow-y-auto pr-1">
                <div className="rounded-md border border-[var(--color-border)] p-3">
                  <p className="text-xs font-medium text-[var(--color-muted-fg)]">Mode admin RBAC</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success-500)]" />
                    <span>Utilisateur admin détecté</span>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={opsDryRun}
                      onChange={() => setOpsDryRun((v) => !v)}
                    />
                    Dry-run (aucune exécution réelle)
                  </label>
                </div>

                <div className="rounded-md border border-[var(--color-border)] p-3">
                  <p className="text-xs font-medium text-[var(--color-muted-fg)]">Actions sensibles</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runAdminAction("Créer PR", "Prépare une PR pour la feature en cours avec plan de tests et rollback.")
                      }
                    >
                      PR
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runAdminAction("Lancer CI", "Prépare les commandes pour relancer la CI et vérifier les checks.")
                      }
                    >
                      CI
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runAdminAction("Deploy", "Prépare le déploiement prod avec smoke tests et critères de succès.")
                      }
                    >
                      Deploy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runAdminAction("Rollback", "Prépare le rollback propre avec validations post-rollback.")
                      }
                    >
                      Rollback
                    </Button>
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
                          <span>
                            {new Date(entry.at).toLocaleTimeString()} — {entry.action}
                          </span>
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
      </div>

      <div className="border-t border-[var(--color-border)] p-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              disabled={isStreaming}
              onClick={() => dispatchPrompt(action.prompt)}
              className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
          {isAdmin && (
            <button
              disabled={isStreaming}
              onClick={() =>
                runAdminAction(
                  "Build/Release",
                  "Prépare une stratégie Build/Release: checks, PR, CI, deploy, rollback.",
                )
              }
              className="rounded-full border border-[var(--color-brand-500)] px-2.5 py-1 text-[11px] text-[var(--color-brand-500)] hover:bg-[var(--color-brand-500)]/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Rocket className="mr-1 inline h-3 w-3" /> Build/Release
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Demander à Hermes..."
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]"
          />
          <Button size="icon" onClick={handleSend} disabled={isStreaming || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
