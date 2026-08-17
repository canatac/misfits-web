"use client";

import { ChatPanelWorkspace } from "@/components/mail/chat-panel/chat-panel-workspace";
import { ChatAiTab } from "@/components/mail/chat-panel/parts/chat-ai-tab";
import { SensitivePromptBanner } from "@/components/mail/chat-panel/parts/sensitive-prompt-banner";
import type { ComponentProps } from "react";

type AiTabProps = ComponentProps<typeof ChatAiTab>;
type WorkspaceProps = ComponentProps<typeof ChatPanelWorkspace>;

interface ChatPanelBodyProps {
  pendingSensitivePrompt: unknown;
  onConfirmSensitivePrompt: () => void;
  onCancelSensitivePrompt: () => void;
  lastRedactionCount: number;
  workspaceTab: WorkspaceProps["tab"] | "ai";
  aiTabProps: AiTabProps;
  workspaceProps: WorkspaceProps;
}

export function ChatPanelBody({
  pendingSensitivePrompt,
  onConfirmSensitivePrompt,
  onCancelSensitivePrompt,
  lastRedactionCount,
  workspaceTab,
  aiTabProps,
  workspaceProps,
}: ChatPanelBodyProps) {
  return (
    <>
      {pendingSensitivePrompt && (
        <SensitivePromptBanner
          onConfirm={onConfirmSensitivePrompt}
          onCancel={onCancelSensitivePrompt}
        />
      )}

      {lastRedactionCount > 0 && (
        <div className="mx-3 mt-2 rounded border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-2 py-1 text-[11px] text-[var(--color-muted-fg)]">
          PII masquée avant envoi: {lastRedactionCount} élément(s)
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden p-3">
        {workspaceTab === "ai" ? (
          <ChatAiTab {...aiTabProps} />
        ) : (
          <ChatPanelWorkspace {...workspaceProps} />
        )}
      </div>
    </>
  );
}
