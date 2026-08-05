"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useEmailStore } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useAuthStore } from "@/stores/auth-store";
import { ChatMessageBubble } from "@/components/mail/chat-message";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Send,
  Sparkles,
  X,
} from "lucide-react";

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
  } = useChatStore();

  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"assistant" | "trace" | "memory">(
    "assistant",
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeConversationId);

  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const selectedThreadId = useThreadStore((s) => s.selectedThreadId);
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const chatContext = useMemo(
    () => ({
      currentEmailId: selectedEmailId ?? undefined,
      currentFolder,
      threadId: selectedThreadId ?? selectedEmailId ?? undefined,
      userId: userId ? String(userId) : undefined,
    }),
    [selectedEmailId, currentFolder, selectedThreadId, userId],
  );

  const sessionId = chatContext.threadId
    ? `mail-thread-${chatContext.threadId}`
    : "(none)";
  const sessionKey = chatContext.userId ? `user-${chatContext.userId}` : "(none)";

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [active?.messages.length, isStreaming, traceEvents.length, activeTab]);

  if (!isOpen) return null;

  const dispatchPrompt = (prompt: string) => {
    if (!active) createConversation();
    void sendMessage(prompt, chatContext);
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    dispatchPrompt(input.trim());
    setInput("");
  };

  const copySessionContext = async () => {
    const payload = `session_id=${sessionId}\nsession_key=${sessionKey}\nfolder=${chatContext.currentFolder ?? "(none)"}`;
    await navigator.clipboard.writeText(payload);
  };

  return (
    <div className="fixed right-0 top-0 z-50 flex h-screen w-[30rem] max-w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-bg)] shadow-xl">
      <div className="border-b border-[var(--color-border)] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-brand-500)]" />
            <span className="text-sm font-semibold">Mail Assistant</span>
            <Badge variant="secondary" className="text-[10px]">
              équilibré
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
          <Badge variant={traceStats.error > 0 ? "destructive" : "success"}>
            {confidence}
          </Badge>
          <Badge variant="outline">Session: {sessionId}</Badge>
          <Badge variant="outline">User: {sessionKey}</Badge>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-3">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "assistant" | "trace" | "memory")}
          className="flex h-full flex-col"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
            <TabsTrigger value="trace">Exécution</TabsTrigger>
            <TabsTrigger value="memory">Mémoire</TabsTrigger>
          </TabsList>

          <TabsContent value="assistant" className="mt-3 flex-1 overflow-hidden">
            <div ref={scrollRef} className="h-full space-y-3 overflow-y-auto pr-1">
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

              {active?.messages.map((msg, i) => <ChatMessageBubble key={i} message={msg} />)}

              {isStreaming && (
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted-fg)]">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  {traceEnabled ? "Exécution Hermes en cours..." : "Thinking..."}
                </div>
              )}
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
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1"
                  onClick={() => {
                    void copySessionContext();
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copier le contexte
                </Button>
              </div>

              <div className="rounded-md border border-[var(--color-border)] p-3 text-xs text-[var(--color-muted-fg)]">
                <p className="font-medium text-[var(--color-fg)]">Mémoire longue durée</p>
                <p className="mt-1">
                  En prod, la mémoire Honcho est gérée côté service Hermes (workspace profilé).
                  Ici, ce panneau expose le contexte de session utilisé pour la continuité.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success-500)]" />
                  <span>Session scoping actif</span>
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
