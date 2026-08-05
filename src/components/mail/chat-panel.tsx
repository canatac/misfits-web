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
  X,
} from "lucide-react";
import type { ChatMessage } from "@/types/chat";

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

type TaskItem = {
  id: string;
  text: string;
  done: boolean;
};

type OpsAction = {
  at: number;
  action: string;
  mode: "dry-run" | "execute";
};

function parseTaskCandidates(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^(-|\*|\d+\.)\s+/.test(line) || /TODO|action/i.test(line))
    .map((line) => line.replace(/^(-|\*|\d+\.)\s+/, ""))
    .slice(0, 8);
}

function containsSensitiveIntent(value: string): boolean {
  const lower = value.toLowerCase();
  return SENSITIVE_KEYWORDS.some((k) => lower.includes(k));
}

export function ChatPanel() {
  const {
    isOpen,
    setOpen,
    conversations,
    activeConversationId,
    sendMessage,
    isStreaming,
    createConversation,
    traceEnabled,
    traceEvents,
    setTraceEnabled,
    clearTrace,
    selectConversation,
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

  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const selectedThreadId = useThreadStore((s) => s.selectedThreadId);
  const user = useAuthStore((s) => s.user);
  const openComposer = useComposerStore((s) => s.openComposer);

  const active = conversations.find((c) => c.id === activeConversationId);
  const isAdmin = user?.role === "admin";

  const chatContext = useMemo(
    () => ({
      currentEmailId: selectedEmailId ?? undefined,
      currentFolder,
      threadId: selectedThreadId ?? selectedEmailId ?? undefined,
      userId: user?.id ? String(user.id) : undefined,
    }),
    [selectedEmailId, currentFolder, selectedThreadId, user?.id],
  );

  const sessionId = chatContext.threadId ? `mail-thread-${chatContext.threadId}` : "(none)";
  const sessionKey = chatContext.userId ? `user-${chatContext.userId}` : "(none)";

  const memoryKey = useMemo(() => `mfa.chat.memory.${sessionKey}`, [sessionKey]);
  const tasksKey = useMemo(() => `mfa.chat.tasks.${sessionKey}`, [sessionKey]);

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
  }, [isOpen, memoryKey, tasksKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages.length, isStreaming, traceEvents.length, activeTab, taskItems.length]);

  if (!isOpen) return null;

  const dispatchPrompt = (prompt: string) => {
    if (!active) createConversation();
    void sendMessage(prompt, chatContext);
  };

  const askForVariant = (tone: "court" | "professionnel" | "empathique") => {
    if (!lastAssistantMessage) return;
    dispatchPrompt(
      `Reformule la dernière proposition en ton ${tone}. Réponse directement exploitable en email.\n\nTexte source:\n${lastAssistantMessage.content}`,
    );
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    if (containsSensitiveIntent(input)) {
      setPendingSensitivePrompt(input.trim());
      return;
    }
    dispatchPrompt(input.trim());
    setInput("");
  };

  const handleConfirmSensitivePrompt = () => {
    if (!pendingSensitivePrompt) return;
    dispatchPrompt(pendingSensitivePrompt);
    setInput("");
    setPendingSensitivePrompt(null);
  };

  const copySessionContext = async () => {
    const payload = `session_id=${sessionId}\nsession_key=${sessionKey}\nfolder=${chatContext.currentFolder ?? "(none)"}`;
    await navigator.clipboard.writeText(payload);
  };

  const handleInsertToDraft = (content: string) => {
    openComposer({
      subject: "Réponse proposée par Hermes",
      body: `<p>${content.replace(/\n/g, "<br/>")}</p>`,
    });
  };

  const handleCreateTasks = (content: string) => {
    const candidates = parseTaskCandidates(content);
    if (candidates.length === 0) return;
    const appended = candidates.map((text) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text,
      done: false,
    }));
    const next = [...taskItems, ...appended].slice(-20);
    setTaskItems(next);
    window.localStorage.setItem(tasksKey, JSON.stringify(next));
  };

  const toggleTask = (id: string) => {
    const next = taskItems.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTaskItems(next);
    window.localStorage.setItem(tasksKey, JSON.stringify(next));
  };

  const runAdminAction = (action: string, prompt: string) => {
    const mode: OpsAction["mode"] = opsDryRun ? "dry-run" : "execute";
    setOpsHistory((prev) => [{ at: Date.now(), action, mode }, ...prev].slice(0, 20));
    const finalPrompt = opsDryRun
      ? `[DRY-RUN ADMIN] ${prompt}\n\nNe rien exécuter. Produire un plan + commandes de vérification.`
      : `[ADMIN ACTION] ${prompt}`;
    dispatchPrompt(finalPrompt);
  };

  const saveMemoryNote = () => {
    window.localStorage.setItem(memoryKey, memoryNote);
  };

  return (
    <div className="fixed right-0 top-0 z-50 flex h-screen w-[32rem] max-w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl">
      <div className="border-b border-[var(--color-border)] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-brand-500)]" />
            <span className="text-sm font-semibold">Mail Assistant</span>
            <Badge variant="secondary" className="text-[10px]">
              équilibré+
            </Badge>
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
        </div>

        <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-2">
          <p className="text-[11px] font-medium text-[var(--color-muted-fg)]">Résumé vivant du thread</p>
          <p className="mt-1 text-xs">{livingSummary}</p>
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
            <div className="mb-2 flex items-center gap-2">
              <Search className="h-4 w-4 text-[var(--color-muted-fg)]" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Rechercher dans l'historique IA"
              />
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

            <div ref={scrollRef} className="h-[calc(100%-5.5rem)] space-y-3 overflow-y-auto pr-1">
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
                />
              ))}

              {isStreaming && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-fg)]">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  {traceEnabled ? "Exécution Hermes en cours..." : "Thinking..."}
                </div>
              )}
            </div>

            {lastAssistantMessage && (
              <div className="mt-2 rounded-md border border-[var(--color-border)] p-2">
                <p className="text-[11px] font-medium text-[var(--color-muted-fg)]">Variantes ton</p>
                <div className="mt-1 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => askForVariant("court")}>
                    A court
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => askForVariant("professionnel")}>
                    B pro
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => askForVariant("empathique")}>
                    C empathique
                  </Button>
                </div>
              </div>
            )}
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
                    {traceEvents.slice(-40).map((e) => (
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
                  <p>
                    <span className="text-[var(--color-muted-fg)]">session_id:</span> {sessionId}
                  </p>
                  <p>
                    <span className="text-[var(--color-muted-fg)]">session_key:</span> {sessionKey}
                  </p>
                  <p>
                    <span className="text-[var(--color-muted-fg)]">folder:</span>{" "}
                    {chatContext.currentFolder ?? "(none)"}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => void copySessionContext()}>
                  <Copy className="h-3.5 w-3.5" /> Copier le contexte
                </Button>
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
                  <Button size="sm" onClick={saveMemoryNote}>
                    Sauvegarder
                  </Button>
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
                <p className="text-xs font-medium text-[var(--color-muted-fg)]">TODO exploitables</p>
                {taskItems.length === 0 ? (
                  <p className="mt-1 text-xs text-[var(--color-muted-fg)]">
                    Utilise « Créer tâches » depuis une réponse assistant pour remplir cette liste.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1">
                    {taskItems.map((task) => (
                      <label key={task.id} className="flex items-start gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTask(task.id)}
                          className="mt-0.5"
                        />
                        <span className={task.done ? "line-through text-[var(--color-muted-fg)]" : ""}>{task.text}</span>
                      </label>
                    ))}
                  </div>
                )}
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
