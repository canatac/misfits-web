"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChatPanelHeader } from "@/components/mail/chat-panel/chat-panel-header";
import { ChatPanelTabs } from "@/components/mail/chat-panel/chat-panel-tabs";
import { ChatPanelInput } from "@/components/mail/chat-panel/chat-panel-input";
import { useChatPanelState } from "@/components/mail/chat-panel/use-chat-panel-state";
import { useChatPanelHandlers } from "@/components/mail/chat-panel/use-chat-panel-handlers";
import { useChatPanelDerived } from "@/components/mail/chat-panel/parts/use-chat-panel-derived";
import { ChatPanelBody } from "@/components/mail/chat-panel/parts/chat-panel-body";
import type { PersonaPreset } from "./chat-panel/chat-panel-utils";

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
    chatStore: {
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
    },
    active,
    isAdmin,
    selectedEmail,
    chatContext,
    sessionId,
    sessionKey,
    storageKeys,
    traceStats,
    lastAssistantMessage,
    lastUserMessage,
    agendaEmails,
    selectEmail,
    selectThread,
    openComposer,
  } = useChatPanelDerived();

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

  const pendingTasks = useMemo(
    () => taskItems.filter((t) => !t.done).slice(0, 8),
    [taskItems]
  );

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

  if (!isOpen) return null;

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

      <ChatPanelBody
        pendingSensitivePrompt={pendingSensitivePrompt}
        onConfirmSensitivePrompt={handleConfirmSensitivePrompt}
        onCancelSensitivePrompt={() =>
          dispatch({ type: "setPendingSensitivePrompt", value: null })
        }
        lastRedactionCount={lastRedactionCount}
        workspaceTab={workspaceTab}
        aiTabProps={{
          uiMode, conversations, activeConversationId, active,
          lastAssistantMessage, lastUserMessage, isStreaming,
          searchValue, setSearchValue, templateId,
          onTemplateIdChange: (value) => dispatch({ type: "setTemplateId", value }),
          selectConversation, dispatchPrompt, handleInsertToDraft,
          handleCreateTasks, handleSourceClick, handleFeedback,
          askForVariant, regenerate, stopCurrent, traceEvents, traceStats,
          clearTrace, sessionId, sessionKey,
          folderLabel: chatContext.currentFolder ?? "(none)",
          copySessionContext, persona,
          persistPersona: (next) => persistPersona({
            tone: next.tone as PersonaPreset["tone"],
            length: next.length as PersonaPreset["length"],
            language: next.language as PersonaPreset["language"],
          }),
          memoryNote,
          onMemoryNoteChange: (value) => dispatch({ type: "setMemoryNote", value }),
          persistMemoryNote, clearMemoryNote, taskItems, toggleTask,
          executeTaskOnBackend, lastExecError, analytics, lastLatencyMs,
          isAdmin, opsDryRun,
          toggleOpsDryRun: () => dispatch({ type: "toggleOpsDryRun" }),
          runAdminAction, opsHistory,
        }}
        workspaceProps={{
          tab: workspaceTab as "agenda" | "tasks",
          agendaEmails, pendingTasks,
          onSelectEmail: selectEmail, onToggleTask: toggleTask,
        }}
      />

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
