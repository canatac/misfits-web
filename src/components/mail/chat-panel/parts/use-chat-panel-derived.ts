"use client";

import { useMemo } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useEmailStore } from "@/stores/email-store";
import { useThreadStore } from "@/stores/thread-store";
import { useAuthStore } from "@/stores/auth-store";
import { useComposerStore } from "@/stores/composer-store";
import type { ChatConversation } from "@/types/chat";
import type { ChatTraceEvent } from "@/stores/chat-types";
import type { Email } from "@/types/email";

export function useChatPanelDerived() {
  const chatStore = useChatStore();
  const emails = useEmailStore((s) => s.emails);
  const selectedEmailId = useEmailStore((s) => s.selectedEmailId);
  const selectEmail = useEmailStore((s) => s.selectEmail);
  const currentFolder = useEmailStore((s) => s.currentFolder);
  const selectedThreadId = useThreadStore((s) => s.selectedThreadId);
  const selectThread = useThreadStore((s) => s.selectThread);
  const user = useAuthStore((s) => s.user);
  const openComposer = useComposerStore((s) => s.openComposer);

  const active =
    chatStore.conversations.find(
      (c: ChatConversation) => c.id === chatStore.activeConversationId
    ) ?? null;
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

  const traceStats = useMemo(() => {
    const info = chatStore.traceEvents.filter(
      (e: ChatTraceEvent) => e.level === "info"
    ).length;
    const warn = chatStore.traceEvents.filter(
      (e: ChatTraceEvent) => e.level === "warn"
    ).length;
    const error = chatStore.traceEvents.filter(
      (e: ChatTraceEvent) => e.level === "error"
    ).length;
    return { info, warn, error };
  }, [chatStore.traceEvents]);

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

  return {
    chatStore,
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
  };
}
