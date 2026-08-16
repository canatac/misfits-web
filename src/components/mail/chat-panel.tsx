"use client";

import { useMemo } from "react";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/chat-store";
import { useEmailStore } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useAuthStore } from "@/stores/auth-store";
import { useComposerStore } from "@/stores/composer-store";
import { Button } from "@/components/ui/button";
import { ChatPanelHeader } from "@/components/mail/chat-panel/chat-panel-header";
import { ChatAssistantView } from "@/components/mail/chat-panel/chat-assistant-view";
import { ChatExpertView } from "@/components/mail/chat-panel/chat-expert-view";
import { ChatPanelTabs } from "@/components/mail/chat-panel/chat-panel-tabs";
import { ChatPanelWorkspace } from "@/components/mail/chat-panel/chat-panel-workspace";
import { ChatPanelInput } from "@/components/mail/chat-panel/chat-panel-input";
import { useChatPanelState } from "@/components/mail/chat-panel/use-chat-panel-state";
import { useChatPanelHandlers } from "@/components/mail/chat-panel/use-chat-panel-handlers";
import type { ChatConversation } from "@/types/chat";
import type { ChatTraceEvent } from "@/stores/chat-types";
import type { Email } from "@/types/email";
import {
  QUICK_PROMPTS,
  QUICK_ACTIONS,
  ROLE_TEMPLATES,
  type PersonaPreset,
} from "./chat-panel/chat-panel-utils";

interface ChatPanelProps {
  layout?: "overlay" | "inline" | "docked";
  className?: string;
  onRequestClose?: () => void;
}

export function ChatPanel({
  layout = "overlay",
  className,
  onRequestClose,
}: ChatPanelProps) {
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

  const emails = useEmailStore((s) => s.emails);
  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const selectEmail = useEmailStore((s) => s.selectEmail);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const selectedThreadId = useThreadStore((s) => s.selectedThreadId);
  const selectThread = useThreadStore((s) => s.selectThread);
  const user = useAuthStore((s) => s.user);
  const openComposer = useComposerStore((s) => s.openComposer);

  const active =
    conversations.find((c: ChatConversation) => c.id === activeConversationId) ?? null;
  const isAdmin = user?.role === "admin";
  const selectedEmail = useMemo(
    () => emails.find((e: Email) => e.id === selectedEmailId) ?? null,
    [emails, selectedEmailId]
  );

  const chatContext = useMemo(
    () => ({
      currentEmailId: selectedEmailId ?? undefined,
      currentFolder,
      threadId: selectedThreadId ?? selectedEmailId ?? undefined,
      userId: user?.id ? String(user.id) : undefined,
      attachmentNames: (selectedEmail?.attachments ?? [])
        .slice(0, 8)
        .map((a) => a.filename),
    }),
    [
      selectedEmailId,
      currentFolder,
      selectedThreadId,
      user?.id,
      selectedEmail?.attachments,
    ]
  );

  const sessionId = chatContext.threadId
    ? `mail-thread-${chatContext.threadId}`
    : "(none)";
  const sessionKey = chatContext.userId
    ? `user-${chatContext.userId}`
    : "(none)";

  const storageKeys = useMemo(
    () => ({
      memoryKey: `mfa.chat.memory.${sessionKey}`,
      tasksKey: `mfa.chat.tasks.${sessionKey}`,
      personaKey: `mfa.chat.persona.${sessionKey}`,
      analyticsKey: `mfa.chat.analytics.${sessionKey}`,
    }),
    [sessionKey]
  );

  const {
    state,
    dispatch,
    input,
    setInput,
    searchValue,
    setSearchValue,
    bumpAnalytics,
    persistTasks,
    persistPersona,
    persistMemoryNote,
    clearMemoryNote,
  } = useChatPanelState({ isOpen, storageKeys });

  const {
    uiMode,
    workspaceTab,
    pendingSensitivePrompt,
    opsDryRun,
    opsHistory,
    memoryNote,
    taskItems,
    templateId,
    persona,
    analytics,
    lastRedactionCount,
    lastExecError,
  } = state;

  const traceStats = useMemo(() => {
    const info = traceEvents.filter((e: ChatTraceEvent) => e.level === "info").length;
    const warn = traceEvents.filter((e: ChatTraceEvent) => e.level === "warn").length;
    const error = traceEvents.filter((e: ChatTraceEvent) => e.level === "error").length;
    return { info, warn, error };
  }, [traceEvents]);

  const lastAssistantMessage = useMemo(
    () =>
      [...(active?.messages ?? [])]
        .reverse()
        .find((m) => m.role === "assistant") ?? null,
    [active]
  );
  const lastUserMessage = useMemo(
    () =>
      [...(active?.messages ?? [])].reverse().find((m) => m.role === "user") ??
      null,
    [active]
  );

  const agendaEmails = useMemo(
    () =>
      emails
        .filter((e) =>
          /meeting|call|deadline|rdv|agenda|today|tomorrow/i.test(
            `${e.subject} ${e.preview}`
          )
        )
        .slice(0, 6),
    [emails]
  );

  const pendingTasks = useMemo(
    () => taskItems.filter((t) => !t.done).slice(0, 8),
    [taskItems]
  );

  if (!isOpen) return null;

  const {
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
  } = useChatPanelHandlers({
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
  });

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
          ? "fixed top-0 right-0 z-50 flex h-screen w-[34rem] max-w-full flex-col border-l border-[#242427] bg-[#0A0A0B] shadow-2xl"
          : "flex h-full w-full flex-col border-l border-[#242427] bg-[#0A0A0B]",
        className
      )}
    >
      <ChatPanelHeader
        uiMode={uiMode}
        onModeChange={(value) => dispatch({ type: "setUiMode", value })}
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

      <ChatPanelTabs
        confidenceLabel={confidenceLabel}
        hasErrors={traceStats.error > 0}
        uiMode={uiMode}
        selectedEmailSubject={selectedEmail?.subject}
        sessionId={sessionId}
        sessionKey={sessionKey}
        workspaceTab={workspaceTab}
        onWorkspaceTabChange={(value) =>
          dispatch({ type: "setWorkspaceTab", value })
        }
        conversationsCount={conversations.length}
        agendaCount={agendaEmails.length}
        pendingTasksCount={pendingTasks.length}
      />

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
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                dispatch({ type: "setPendingSensitivePrompt", value: null })
              }
            >
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
              onTemplateIdChange={(value) =>
                dispatch({ type: "setTemplateId", value })
              }
              roleTemplates={ROLE_TEMPLATES.map((t) => ({
                id: t.id,
                label: `Template: ${t.label}`,
              }))}
              quickPrompts={QUICK_PROMPTS}
              quickActions={QUICK_ACTIONS.map((a) => ({
                id: a.id,
                label: a.label,
                prompt: a.prompt,
              }))}
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
                persistPersona({
                  tone: next.tone as PersonaPreset["tone"],
                  length: next.length as PersonaPreset["length"],
                  language: next.language as PersonaPreset["language"],
                });
              }}
              memoryNote={memoryNote}
              onMemoryNoteChange={(value) =>
                dispatch({ type: "setMemoryNote", value })
              }
              onSaveMemoryNote={() => persistMemoryNote(memoryNote)}
              onClearMemoryNote={clearMemoryNote}
              taskItems={taskItems}
              onToggleTask={toggleTask}
              onExecuteTask={(id) => void executeTaskOnBackend(id)}
              lastExecError={lastExecError}
              analytics={analytics}
              lastLatencyMs={lastLatencyMs}
              isAdmin={isAdmin}
              opsDryRun={opsDryRun}
              onToggleOpsDryRun={() => dispatch({ type: "toggleOpsDryRun" })}
              onRunAdminAction={runAdminAction}
              opsHistory={opsHistory}
            />
          )
        ) : (
          <ChatPanelWorkspace
            tab={workspaceTab}
            agendaEmails={agendaEmails}
            pendingTasks={pendingTasks}
            onSelectEmail={selectEmail}
            onToggleTask={toggleTask}
          />
        )}
      </div>

      <ChatPanelInput
        input={input}
        onInputChange={setInput}
        onSend={handleSend}
        isStreaming={isStreaming}
        canInsertLatest={Boolean(lastAssistantMessage?.content)}
        onInsertLatest={insertLatestToDraft}
        canRegenerate={Boolean(lastUserMessage)}
        onRegenerate={regenerate}
      />
    </div>
  );
}
