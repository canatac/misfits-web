"use client";

import type { Dispatch } from "react";
import type { ChatSourceCitation } from "@/types/chat";
import type { ChatPanelAction } from "./use-chat-panel-state";
import type { ChatContext } from "@/types/chat";
import {
  ROLE_TEMPLATES,
  containsSensitiveIntent,
  parseTaskCandidates,
  redactPii,
  buildPersonaInstruction,
  type PersonaPreset,
} from "./chat-panel-utils";

type TaskItem = {
  id: string;
  text: string;
  done: boolean;
  status: "idle" | "running" | "done" | "failed";
  runId?: string;
};

type ChatMessage = { role: string; content: string };

interface UseHandlersArgs {
  dispatch: Dispatch<ChatPanelAction>;
  input: string;
  setInput: (v: string) => void;
  isStreaming: boolean;
  active: { messages?: ChatMessage[] } | null;
  createConversation: () => void;
  sendMessage: (prompt: string, ctx: ChatContext) => Promise<void> | void;
  stopStreaming: () => void;
  chatContext: ChatContext;
  sessionId: string;
  sessionKey: string;
  templateId: string;
  persona: PersonaPreset;
  pendingSensitivePrompt: string | null;
  opsDryRun: boolean;
  taskItems: TaskItem[];
  lastAssistantMessage: ChatMessage | null;
  lastUserMessage: ChatMessage | null;
  bumpAnalytics: (delta: Record<string, number>) => void;
  persistTasks: (items: TaskItem[]) => void;
  openComposer: (payload: { subject: string; body: string }) => void;
  selectEmail: (id: string) => void;
  selectThread: (id: string) => void;
}

export function useChatPanelHandlers(args: UseHandlersArgs) {
  const {
    dispatch,
    input,
    setInput,
    isStreaming,
    active,
    createConversation,
    sendMessage,
    stopStreaming,
    chatContext,
    sessionId,
    sessionKey,
    templateId,
    persona,
    pendingSensitivePrompt,
    opsDryRun,
    taskItems,
    lastAssistantMessage,
    lastUserMessage,
    bumpAnalytics,
    persistTasks,
    openComposer,
    selectEmail,
    selectThread,
  } = args;

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
      `Reformule la dernière proposition en ton ${tone}. Réponse directement exploitable en email.\n\nTexte source:\n${lastAssistantMessage.content}`
    );
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const redacted = redactPii(input.trim());
    dispatch({ type: "setLastRedactionCount", value: redacted.count });
    if (redacted.count > 0) bumpAnalytics({ redactions: redacted.count });
    if (containsSensitiveIntent(redacted.sanitized)) {
      dispatch({ type: "setPendingSensitivePrompt", value: redacted.sanitized });
      return;
    }
    dispatchPrompt(redacted.sanitized);
    setInput("");
  };

  const handleConfirmSensitivePrompt = () => {
    if (!pendingSensitivePrompt) return;
    dispatchPrompt(pendingSensitivePrompt);
    setInput("");
    dispatch({ type: "setPendingSensitivePrompt", value: null });
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
    persistTasks([...taskItems, ...appended].slice(-20));
  };

  const toggleTask = (id: string) => {
    persistTasks(taskItems.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const executeTaskOnBackend = async (taskId: string) => {
    dispatch({ type: "setLastExecError", value: null });
    const task = taskItems.find((t) => t.id === taskId);
    if (!task) return;
    persistTasks(
      taskItems.map((t) => (t.id === taskId ? { ...t, status: "running" } : t))
    );
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
      if (!response.ok) throw new Error(`Backend task run failed (${response.status})`);
      const data = (await response.json().catch(() => ({}))) as {
        run_id?: string;
        id?: string;
      };
      const runId = data.run_id ?? data.id ?? "n/a";
      bumpAnalytics({ backendTaskRuns: 1 });
      persistTasks(
        taskItems.map((t) =>
          t.id === taskId ? { ...t, status: "done", done: true, runId } : t
        )
      );
    } catch (err) {
      persistTasks(
        taskItems.map((t) => (t.id === taskId ? { ...t, status: "failed" } : t))
      );
      dispatch({
        type: "setLastExecError",
        value: err instanceof Error ? err.message : "Échec exécution backend",
      });
    }
  };

  const handleSourceClick = (source: ChatSourceCitation) => {
    if (source.kind === "email") {
      selectEmail(source.value);
      return;
    }
    if (source.kind === "thread") selectThread(source.value);
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
    const mode = opsDryRun ? "dry-run" : "execute";
    dispatch({ type: "pushOpsAction", value: { at: Date.now(), action, mode } });
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
      `Régénère une meilleure version de la réponse précédente pour ce prompt:\n${lastUserMessage.content}`
    );
  };

  return {
    dispatchPrompt,
    askForVariant,
    handleSend,
    handleConfirmSensitivePrompt,
    copySessionContext,
    handleInsertToDraft,
    insertLatestToDraft,
    handleCreateTasks,
    toggleTask,
    executeTaskOnBackend,
    handleSourceClick,
    handleFeedback,
    runAdminAction,
    stopCurrent,
    regenerate,
  };
}
