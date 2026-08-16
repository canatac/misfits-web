"use client";

import type { ComponentProps } from "react";
import { ChatAssistantView } from "@/components/mail/chat-panel/chat-assistant-view";
import { ChatExpertView } from "@/components/mail/chat-panel/chat-expert-view";
import {
  QUICK_PROMPTS,
  QUICK_ACTIONS,
  ROLE_TEMPLATES,
  type PersonaPreset,
} from "@/components/mail/chat-panel/chat-panel-utils";

type AssistantProps = ComponentProps<typeof ChatAssistantView>;
type ExpertProps = ComponentProps<typeof ChatExpertView>;

interface ChatAiTabProps {
  uiMode: "assistant" | "expert";
  // assistant
  conversations: AssistantProps["conversations"];
  activeConversationId: AssistantProps["activeConversationId"];
  active: AssistantProps["activeConversation"];
  lastAssistantMessage: AssistantProps["lastAssistantMessage"];
  lastUserMessage: AssistantProps["lastUserMessage"];
  isStreaming: boolean;
  searchValue: string;
  setSearchValue: (v: string) => void;
  templateId: string;
  onTemplateIdChange: (value: string) => void;
  selectConversation: AssistantProps["onSelectConversation"];
  dispatchPrompt: AssistantProps["onDispatchPrompt"];
  handleInsertToDraft: AssistantProps["onInsertToDraft"];
  handleCreateTasks: AssistantProps["onCreateTasks"];
  handleSourceClick: AssistantProps["onSourceClick"];
  handleFeedback: AssistantProps["onFeedback"];
  askForVariant: AssistantProps["onAskVariant"];
  regenerate: AssistantProps["onRegenerate"];
  stopCurrent: AssistantProps["onStop"];
  // expert
  traceEvents: ExpertProps["traceEvents"];
  traceStats: ExpertProps["traceStats"];
  clearTrace: ExpertProps["onClearTrace"];
  sessionId: string;
  sessionKey: string;
  folderLabel: string;
  copySessionContext: () => Promise<void> | void;
  persona: ExpertProps["persona"];
  persistPersona: (p: PersonaPreset) => void;
  memoryNote: ExpertProps["memoryNote"];
  onMemoryNoteChange: ExpertProps["onMemoryNoteChange"];
  persistMemoryNote: (v: string) => void;
  clearMemoryNote: ExpertProps["onClearMemoryNote"];
  taskItems: ExpertProps["taskItems"];
  toggleTask: ExpertProps["onToggleTask"];
  executeTaskOnBackend: (id: string) => Promise<void> | void;
  lastExecError: ExpertProps["lastExecError"];
  analytics: ExpertProps["analytics"];
  lastLatencyMs: ExpertProps["lastLatencyMs"];
  isAdmin: boolean;
  opsDryRun: boolean;
  toggleOpsDryRun: () => void;
  runAdminAction: ExpertProps["onRunAdminAction"];
  opsHistory: ExpertProps["opsHistory"];
}

export function ChatAiTab(props: ChatAiTabProps) {
  if (props.uiMode === "assistant") {
    return (
      <ChatAssistantView
        conversations={props.conversations}
        activeConversationId={props.activeConversationId}
        activeConversation={props.active}
        lastAssistantMessage={props.lastAssistantMessage}
        lastUserMessage={props.lastUserMessage}
        isStreaming={props.isStreaming}
        searchValue={props.searchValue}
        onSearchValueChange={props.setSearchValue}
        templateId={props.templateId}
        onTemplateIdChange={props.onTemplateIdChange}
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
        onSelectConversation={props.selectConversation}
        onDispatchPrompt={props.dispatchPrompt}
        onInsertToDraft={props.handleInsertToDraft}
        onCreateTasks={props.handleCreateTasks}
        onSourceClick={props.handleSourceClick}
        onFeedback={props.handleFeedback}
        onAskVariant={props.askForVariant}
        onRegenerate={props.regenerate}
        onStop={props.stopCurrent}
      />
    );
  }
  return (
    <ChatExpertView
      traceEvents={props.traceEvents}
      traceStats={props.traceStats}
      onClearTrace={props.clearTrace}
      sessionId={props.sessionId}
      sessionKey={props.sessionKey}
      folderLabel={props.folderLabel}
      onCopySessionContext={() => void props.copySessionContext()}
      persona={props.persona}
      onPersonaChange={(next) => {
        props.persistPersona({
          tone: next.tone as PersonaPreset["tone"],
          length: next.length as PersonaPreset["length"],
          language: next.language as PersonaPreset["language"],
        });
      }}
      memoryNote={props.memoryNote}
      onMemoryNoteChange={props.onMemoryNoteChange}
      onSaveMemoryNote={() => props.persistMemoryNote(props.memoryNote)}
      onClearMemoryNote={props.clearMemoryNote}
      taskItems={props.taskItems}
      onToggleTask={props.toggleTask}
      onExecuteTask={(id) => void props.executeTaskOnBackend(id)}
      lastExecError={props.lastExecError}
      analytics={props.analytics}
      lastLatencyMs={props.lastLatencyMs}
      isAdmin={props.isAdmin}
      opsDryRun={props.opsDryRun}
      onToggleOpsDryRun={props.toggleOpsDryRun}
      onRunAdminAction={props.runAdminAction}
      opsHistory={props.opsHistory}
    />
  );
}
