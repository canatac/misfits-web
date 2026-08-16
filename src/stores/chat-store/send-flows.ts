import type { ChatContext, ChatConversation, ChatMessage } from "@/types/chat";
import type { ChatTraceEvent } from "../chat-types";
import { chatRepository } from "@/lib/repositories";
import { saveConversations } from "../chat-persistence";
import { toShort, pushTrace, parseSseEventBlocks, extractDataFromBlock } from "../chat-utils";
import {
  summarizeHermesEvent,
  buildSourceCitations,
  deriveConfidence,
  updateAssistantDraft,
} from "../chat-helpers";

interface StorePart {
  conversations: ChatConversation[];
  isStreaming: boolean;
  error: string | null;
  lastLatencyMs: number | null;
  traceEvents: ChatTraceEvent[];
}
export type ChatSet = (
  partial: Partial<StorePart> | ((s: StorePart) => Partial<StorePart>)
) => void;

interface SendContext {
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

export async function runStandardSend(set: ChatSet, ctx: SendContext): Promise<void> {
  const data = await chatRepository.postChat(
    {
      messages: [
        {
          role: "system",
          content: `You are a helpful email assistant for misfits.ai Mail. Answer concisely in French or English. ${ctx.attachmentContextNote}`,
        },
        ...ctx.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      threadId: ctx.resolvedThreadId,
      userId: ctx.resolvedUserId,
      sessionId: ctx.resolvedSessionId,
      sessionKey: ctx.resolvedSessionKey,
    },
    ctx.signal
  );

  const assistantContent =
    data?.choices?.[0]?.message?.content ||
    data?.content ||
    "Sorry, I could not generate a response.";

  const sources = buildSourceCitations(ctx.context);
  const confidence = deriveConfidence("standard", []);
  const latencyMs = Date.now() - ctx.startedAt;
  const assistantMsg: ChatMessage = {
    role: "assistant",
    content: assistantContent,
    timestamp: Date.now(),
    metadata: { ...confidence, sources, latencyMs },
  };

  set((s) => {
    const conversations = s.conversations.map((c) =>
      c.id === ctx.convId
        ? {
            ...c,
            messages: [...c.messages, assistantMsg],
            updatedAt: Date.now(),
          }
        : c
    );
    saveConversations(conversations);
    return { conversations, isStreaming: false, lastLatencyMs: latencyMs };
  });
}

export async function runTraceSend(
  set: ChatSet,
  ctx: SendContext,
  content: string,
  getTraceEvents: () => ChatTraceEvent[]
): Promise<void> {
  pushTrace(set, {
    kind: "trace.start",
    message: "Démarrage run Hermes…",
    level: "info",
  });

  const history = ctx.messages
    .slice(-12)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const runInput = [
    "Tu es l'assistant email de misfits.ai Mail. Réponds de façon concise en français ou anglais.",
    ctx.attachmentContextNote,
    history ? `Historique:\n${history}` : "",
    `Question actuelle:\n${content}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const runData = await chatRepository.createRun(
    {
      input: runInput,
      model: "hermes-agent",
      threadId: ctx.resolvedThreadId,
      userId: ctx.resolvedUserId,
      sessionId: ctx.resolvedSessionId,
      sessionKey: ctx.resolvedSessionKey,
    },
    ctx.signal
  );
  const runId: string | undefined = runData?.run_id || runData?.id;
  if (!runId) throw new Error("Hermes run id missing");

  pushTrace(set, {
    kind: "run.started",
    message: `run_id=${runId}`,
    level: "info",
  });

  const traceSources = buildSourceCitations(ctx.context);

  set((s) => {
    const conversations = updateAssistantDraft(s.conversations, ctx.convId, "", {
      sources: traceSources,
      confidence: "medium",
      confidenceReason: "Réponse en cours de génération.",
    });
    saveConversations(conversations);
    return { conversations };
  });

  const eventsBody = await chatRepository.streamRunEvents(runId, ctx.signal);
  const reader = eventsBody.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let assistantContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { rest, blocks } = parseSseEventBlocks(buffer);
    buffer = rest;

    for (const block of blocks) {
      const dataLines = extractDataFromBlock(block);
      for (const line of dataLines) {
        if (!line || line === "[DONE]") continue;

        let payload: Record<string, unknown> | null = null;
        try {
          payload = JSON.parse(line) as Record<string, unknown>;
        } catch {
          pushTrace(set, {
            kind: "sse.parse",
            message: `chunk: ${toShort(line)}`,
            level: "warn",
          });
          continue;
        }

        pushTrace(set, summarizeHermesEvent(payload));

        if (
          payload.event === "message.delta" &&
          typeof payload.delta === "string"
        ) {
          assistantContent += payload.delta;
          set((s) => {
            const conversations = updateAssistantDraft(
              s.conversations,
              ctx.convId,
              assistantContent,
              {
                sources: traceSources,
                confidence: "medium",
                confidenceReason: "Streaming en cours.",
              }
            );
            saveConversations(conversations);
            return { conversations };
          });
        }

        if (
          payload.event === "run.completed" &&
          !assistantContent &&
          typeof payload.output === "string"
        ) {
          assistantContent = payload.output;
          set((s) => {
            const conversations = updateAssistantDraft(
              s.conversations,
              ctx.convId,
              assistantContent,
              {
                sources: traceSources,
                confidence: "medium",
                confidenceReason: "Streaming en cours.",
              }
            );
            saveConversations(conversations);
            return { conversations };
          });
        }
      }
    }
  }

  if (!assistantContent.trim()) {
    assistantContent = "(Aucune sortie assistant)";
    set((s) => {
      const conversations = updateAssistantDraft(
        s.conversations,
        ctx.convId,
        assistantContent
      );
      saveConversations(conversations);
      return { conversations };
    });
  }

  const finalConfidence = deriveConfidence("trace", getTraceEvents());
  const latencyMs = Date.now() - ctx.startedAt;
  set((s) => {
    const conversations = updateAssistantDraft(
      s.conversations,
      ctx.convId,
      assistantContent,
      { sources: traceSources, ...finalConfidence, latencyMs }
    );
    saveConversations(conversations);
    return { conversations, isStreaming: false, lastLatencyMs: latencyMs };
  });
}
