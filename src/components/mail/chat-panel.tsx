"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChatPanelHeader } from "@/components/mail/chat-panel/chat-panel-header";
import { ChatPanelTabs } from "@/components/mail/chat-panel/chat-panel-tabs";
import { ChatPanelWorkspace } from "@/components/mail/chat-panel/chat-panel-workspace";
import { ChatPanelInput } from "@/components/mail/chat-panel/chat-panel-input";
import { useChatPanelState } from "@/components/mail/chat-panel/use-chat-panel-state";
import { useChatPanelHandlers } from "@/components/mail/chat-panel/use-chat-panel-handlers";
import { ChatAiTab } from "@/components/mail/chat-panel/parts/chat-ai-tab";
import { SensitivePromptBanner } from "@/components/mail/chat-panel/parts/sensitive-prompt-banner";
import { useChatPanelDerived } from "@/components/mail/chat-panel/parts/use-chat-panel-derived";
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

      {pendingSensitivePrompt && (
        <SensitivePromptBanner
          onConfirm={handleConfirmSensitivePrompt}
          onCancel={() =>
            dispatch({ type: "setPendingSensitivePrompt", value: null })
          }
        />
      )}

      {lastRedactionCount > 0 && (
        <div className="mx-3 mt-2 rounded border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-2 py-1 text-[11px] text-[var(--color-muted-fg)]">
          PII masquée avant envoi: {lastRedactionCount} élément(s)
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden p-3">
        {workspaceTab === "ai" ? (
          <ChatAiTab
            uiMode={uiMode}
            conversations={conversations}
            activeConversationId={activeConversationId}
            active={active}
            lastAssistantMessage={lastAssistantMessage}
            lastUserMessage={lastUserMessage}
            isStreaming={isStreaming}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            templateId={templateId}
            onTemplateIdChange={(value) =>
              dispatch({ type: "setTemplateId", value })
            }
            selectConversation={selectConversation}
            dispatchPrompt={dispatchPrompt}
            handleInsertToDraft={handleInsertToDraft}
            handleCreateTasks={handleCreateTasks}
            handleSourceClick={handleSourceClick}
            handleFeedback={handleFeedback}
            askForVariant={askForVariant}
            regenerate={regenerate}
            stopCurrent={stopCurrent}
            traceEvents={traceEvents}
            traceStats={traceStats}
            clearTrace={clearTrace}
            sessionId={sessionId}
            sessionKey={sessionKey}
            folderLabel={chatContext.currentFolder ?? "(none)"}
            copySessionContext={copySessionContext}
            persona={persona}
            persistPersona={(next) =>
              persistPersona({
                tone: next.tone as PersonaPreset["tone"],
                length: next.length as PersonaPreset["length"],
                language: next.language as PersonaPreset["language"],
              })
            }
            memoryNote={memoryNote}
            onMemoryNoteChange={(value) =>
              dispatch({ type: "setMemoryNote", value })
            }
            persistMemoryNote={persistMemoryNote}
            clearMemoryNote={clearMemoryNote}
            taskItems={taskItems}
            toggleTask={toggleTask}
            executeTaskOnBackend={executeTaskOnBackend}
            lastExecError={lastExecError}
            analytics={analytics}
            lastLatencyMs={lastLatencyMs}
            isAdmin={isAdmin}
            opsDryRun={opsDryRun}
            toggleOpsDryRun={() => dispatch({ type: "toggleOpsDryRun" })}
            runAdminAction={runAdminAction}
            opsHistory={opsHistory}
          />
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
