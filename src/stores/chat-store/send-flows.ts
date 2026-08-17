import type { ChatConversation, ChatMessage } from "@/types/chat";
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
import { buildHermesRunInput, type SendContext } from "./send-context";
export { resolveSendContext } from "./send-context";
export type { SendContext } from "./send-context";

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

  const runInput = buildHermesRunInput(
    ctx.messages,
    ctx.attachmentContextNote,
    content
  );

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
