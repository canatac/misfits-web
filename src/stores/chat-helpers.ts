import type { ChatContext, ChatConversation, ChatMessage } from "@/types/chat";
import type { ChatTraceEvent, TraceLevel } from "./chat-types";
import { toShort } from "./chat-utils";

export function summarizeHermesEvent(payload: Record<string, unknown>): {
  kind: string;
  message: string;
  level: TraceLevel;
} {
  const kind = String(payload.event ?? "event");

  if (kind === "message.delta") {
    return {
      kind,
      message: `delta: ${toShort(payload.delta ?? "")}`,
      level: "info",
    };
  }

  if (kind === "reasoning.available") {
    return {
      kind,
      message: `reasoning: ${toShort(payload.text ?? payload.summary ?? "available")}`,
      level: "info",
    };
  }

  if (kind === "run.completed") {
    const usage = payload.usage as Record<string, unknown> | undefined;
    const total = usage?.total_tokens;
    return {
      kind,
      message:
        total !== undefined
          ? `run terminé • total_tokens=${String(total)}`
          : "run terminé",
      level: "info",
    };
  }

  if (kind === "run.failed") {
    return {
      kind,
      message: toShort(payload.error ?? payload.message ?? "run failed"),
      level: "error",
    };
  }

  return {
    kind,
    message: toShort(payload.message ?? payload.detail ?? payload),
    level: "info",
  };
}

export function buildSourceCitations(context?: ChatContext): {
  label: string;
  value: string;
  kind?: "email" | "thread" | "folder" | "attachment";
}[] {
  const sources: {
    label: string;
    value: string;
    kind?: "email" | "thread" | "folder" | "attachment";
  }[] = [];
  if (context?.currentEmailId)
    sources.push({
      label: "Email",
      value: context.currentEmailId,
      kind: "email",
    });
  if (context?.threadId)
    sources.push({ label: "Thread", value: context.threadId, kind: "thread" });
  if (context?.currentFolder)
    sources.push({
      label: "Folder",
      value: context.currentFolder,
      kind: "folder",
    });
  for (const name of context?.attachmentNames ?? []) {
    sources.push({ label: "Attachment", value: name, kind: "attachment" });
  }
  return sources;
}

export function deriveConfidence(
  mode: "trace" | "standard",
  traceEvents: ChatTraceEvent[]
): { confidence: "high" | "medium" | "low"; confidenceReason: string } {
  if (traceEvents.some((e) => e.level === "error")) {
    return {
      confidence: "low",
      confidenceReason:
        "Une ou plusieurs erreurs d'exécution ont été détectées.",
    };
  }
  if (mode === "trace" && traceEvents.some((e) => e.kind === "run.completed")) {
    return {
      confidence: "high",
      confidenceReason:
        "Run complété avec succès et flux d'événements cohérent.",
    };
  }
  return {
    confidence: "medium",
    confidenceReason:
      "Réponse générée sans erreur explicite, mais sans validation externe.",
  };
}

export function updateAssistantDraft(
  convs: ChatConversation[],
  convId: string,
  content: string,
  metadata?: ChatMessage["metadata"]
): ChatConversation[] {
  return convs.map((c) => {
    if (c.id !== convId) return c;
    const messages = [...c.messages];
    const last = messages.at(-1);
    if (last?.role === "assistant") {
      messages[messages.length - 1] = {
        ...last,
        content,
        timestamp: Date.now(),
        metadata: {
          ...(last.metadata ?? {}),
          ...(metadata ?? {}),
          trace: true,
        },
      };
    } else {
      messages.push({
        role: "assistant",
        content,
        timestamp: Date.now(),
        metadata: { ...(metadata ?? {}), trace: true },
      });
    }
    return { ...c, messages, updatedAt: Date.now() };
  });
}
