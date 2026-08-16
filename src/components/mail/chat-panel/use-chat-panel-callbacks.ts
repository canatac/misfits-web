"use client";

import type React from "react";
import type { ChatContext, ChatSourceCitation } from "@/types/chat";
import type {
  ChatPanelState,
  ChatPanelAction,
  TaskItem,
} from "./use-chat-panel-state";
import {
  ROLE_TEMPLATES,
  buildPersonaInstruction,
  containsSensitiveIntent,
  parseTaskCandidates,
  redactPii,
  type PersonaPreset,
} from "./chat-panel-utils";
import { useTaskExecutor } from "./use-task-executor";

interface AssistantMessage {
  content: string;
}

interface Args {
  state: ChatPanelState;
  dispatch: React.Dispatch<ChatPanelAction>;
  taskItems: TaskItem[];
  persistTasks: (items: TaskItem[]) => void;
  bumpAnalytics: (delta: Partial<Record<string, number>>) => void;
  sessionId: string;
  sessionKey: string;
  chatContext: ChatContext;
  active: unknown;
  createConversation: () => string;
  sendMessage: (content: string, context?: ChatContext) => Promise<void>;
  stopStreaming: () => void;
  isStreaming: boolean;
  input: string;
  setInput: (v: string) => void;
  lastAssistantMessage: AssistantMessage | null;
  lastUserMessage: AssistantMessage | null;
  openComposer: (draft: { subject: string; body: string }) => void;
  selectEmail: (id: string) => void;
  selectThread: (id: string) => void;
}

export function useChatPanelCallbacks(args: Args) {
  const {
    state,
    dispatch,
    taskItems,
    persistTasks,
    bumpAnalytics,
    sessionId,
    sessionKey,
    chatContext,
    active,
    createConversation,
    sendMessage,
    stopStreaming,
    isStreaming,
    input,
    setInput,
    lastAssistantMessage,
    lastUserMessage,
    openComposer,
    selectEmail,
    selectThread,
  } = args;

  const { templateId, persona, pendingSensitivePrompt, opsDryRun } = state;

  const dispatchPrompt = (prompt: string) => {
    const templatePrompt = ROLE_TEMPLATES.find((t) => t.id === templateId)?.prompt;
    const finalPrompt = [
      buildPersonaInstruction(persona as PersonaPreset),
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
    persistTasks(
      taskItems.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const executeTaskOnBackend = useTaskExecutor({
    state,
    dispatch,
    taskItems,
    persistTasks,
    bumpAnalytics,
    sessionId,
    sessionKey,
    chatContext,
  });

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
    const mode = opsDryRun ? "dry-run" : "execute";
    dispatch({
      type: "pushOpsAction",
      value: { at: Date.now(), action, mode },
    });
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
