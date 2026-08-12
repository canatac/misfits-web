"use client";

import {
  Search,
  Sparkles,
  Square,
  RefreshCw,
  WandSparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatMessageBubble } from "@/components/mail/chat-message";
import { ChatTrustBlock } from "@/components/mail/chat-panel/chat-trust-block";
import type {
  ChatConversation,
  ChatMessage,
  ChatSourceCitation,
} from "@/types/chat";

type QuickAction = {
  id: string;
  label: string;
  prompt: string;
};

type RoleTemplate = {
  id: string;
  label: string;
};

interface ChatAssistantViewProps {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  activeConversation: ChatConversation | null;
  lastAssistantMessage: ChatMessage | null;
  lastUserMessage: ChatMessage | null;
  isStreaming: boolean;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  templateId: string;
  onTemplateIdChange: (value: string) => void;
  roleTemplates: RoleTemplate[];
  quickPrompts: string[];
  quickActions: QuickAction[];
  onSelectConversation: (id: string) => void;
  onDispatchPrompt: (prompt: string) => void;
  onInsertToDraft: (content: string) => void;
  onCreateTasks: (content: string) => void;
  onSourceClick: (source: ChatSourceCitation) => void;
  onFeedback: (vote: "up" | "down", reason?: string) => void;
  onAskVariant: (tone: "court" | "professionnel" | "empathique") => void;
  onRegenerate: () => void;
  onStop: () => void;
}

export function ChatAssistantView({
  conversations,
  activeConversationId,
  activeConversation,
  lastAssistantMessage,
  lastUserMessage,
  isStreaming,
  searchValue,
  onSearchValueChange,
  templateId,
  onTemplateIdChange,
  roleTemplates,
  quickPrompts,
  quickActions,
  onSelectConversation,
  onDispatchPrompt,
  onInsertToDraft,
  onCreateTasks,
  onSourceClick,
  onFeedback,
  onAskVariant,
  onRegenerate,
  onStop,
}: ChatAssistantViewProps) {
  const q = searchValue.trim().toLowerCase();
  const filteredConversations =
    q.length === 0
      ? conversations
      : conversations.filter((conv) => {
          if (conv.title.toLowerCase().includes(q)) return true;
          return conv.messages.some((m) => m.content.toLowerCase().includes(q));
        });

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-[var(--color-muted-fg)]" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchValueChange(e.target.value)}
            placeholder="Rechercher dans les réponses"
          />
        </div>

        <select
          value={templateId}
          onChange={(e) => onTemplateIdChange(e.target.value)}
          className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2 text-xs"
        >
          <option value="none">Template: aucun</option>
          {roleTemplates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {tpl.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filteredConversations.slice(0, 8).map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
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

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {(!activeConversation || activeConversation.messages.length === 0) && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Sparkles className="h-10 w-10 text-[var(--color-brand-500)]" />
            <p className="text-sm text-[var(--color-muted-fg)]">
              Pose une question ou lance une action rapide.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickPrompts.map((prompt) => (
                <Button
                  key={prompt}
                  size="sm"
                  variant="outline"
                  onClick={() => onDispatchPrompt(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        )}

        {activeConversation?.messages.map((msg, i) => (
          <ChatMessageBubble
            key={i}
            message={msg}
            onInsertToDraft={
              msg.role === "assistant" ? onInsertToDraft : undefined
            }
            onCreateTasks={msg.role === "assistant" ? onCreateTasks : undefined}
            onFeedback={msg.role === "assistant" ? onFeedback : undefined}
          />
        ))}

        <ChatTrustBlock
          message={lastAssistantMessage}
          onSourceClick={onSourceClick}
        />

        {isStreaming && (
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-fg)]">
            <Sparkles className="h-4 w-4 animate-pulse" />
            Génération en temps réel…
            <Button size="sm" variant="destructive" onClick={onStop}>
              <Square className="h-3 w-3" /> Stop
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--color-border)] p-2">
        <span className="text-[11px] text-[var(--color-muted-fg)]">
          Réécriture
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAskVariant("court")}
          disabled={!lastAssistantMessage}
        >
          A court
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAskVariant("professionnel")}
          disabled={!lastAssistantMessage}
        >
          B pro
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAskVariant("empathique")}
          disabled={!lastAssistantMessage}
        >
          C empathique
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onRegenerate}
          disabled={!lastUserMessage || isStreaming}
        >
          <RefreshCw className="h-3 w-3" /> Régénérer
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary">
              <WandSparkles className="h-3 w-3" /> Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {quickActions.map((action) => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => onDispatchPrompt(action.prompt)}
              >
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
