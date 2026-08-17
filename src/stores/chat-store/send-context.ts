import type { ChatContext, ChatMessage } from "@/types/chat";

export interface SendContext {
  convId: string;
  messages: ChatMessage[];
  context?: ChatContext;
  startedAt: number;
  signal: AbortSignal;
  attachmentContextNote: string;
  resolvedThreadId?: string;
  resolvedUserId?: string;
  resolvedSessionId?: string;
  resolvedSessionKey?: string;
}

export function resolveSendContext(
  context: ChatContext | undefined,
  messages: ChatMessage[],
  convId: string,
  startedAt: number,
  signal: AbortSignal
): SendContext {
  const resolvedThreadId = context?.threadId ?? context?.currentEmailId;
  const resolvedUserId = context?.userId;
  const resolvedSessionId =
    context?.sessionId ??
    (resolvedThreadId ? `mail-thread-${resolvedThreadId}` : undefined);
  const resolvedSessionKey =
    context?.sessionKey ??
    (resolvedUserId ? `user-${resolvedUserId}` : undefined);
  const attachmentContextNote =
    (context?.attachmentNames?.length ?? 0) > 0
      ? `Pièces jointes du mail courant: ${(context?.attachmentNames ?? []).join(", ")}. Si nécessaire, demande d'ouvrir la pièce jointe ciblée.`
      : "Aucune pièce jointe signalée dans le contexte.";
  return {
    convId,
    messages,
    context,
    startedAt,
    signal,
    attachmentContextNote,
    resolvedThreadId,
    resolvedUserId,
    resolvedSessionId,
    resolvedSessionKey,
  };
}

/** Build the run input string sent to Hermes runs. */
export function buildHermesRunInput(
  messages: ChatMessage[],
  attachmentContextNote: string,
  content: string
): string {
  const history = messages
    .slice(-12)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  return [
    "Tu es l'assistant email de misfits.ai Mail. Réponds de façon concise en français ou anglais.",
    attachmentContextNote,
    history ? `Historique:\n${history}` : "",
    `Question actuelle:\n${content}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
