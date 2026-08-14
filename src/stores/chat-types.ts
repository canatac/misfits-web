"use client";
// chat-types.ts — extracted Sprint 3-3

type TraceLevel = "info" | "warn" | "error";


export interface ChatTraceEvent {
  id: string;
  at: number;
  kind: string;
  message: string;
  level: TraceLevel;
}


interface ChatStore {
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isStreaming: boolean;
  error: string | null;
  isOpen: boolean;
  traceEnabled: boolean;
  traceEvents: ChatTraceEvent[];
  lastLatencyMs: number | null;
  sendMessage: (content: string, context?: ChatContext) => Promise<void>;
  stopStreaming: () => void;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  selectConversation: (id: string) => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  setTraceEnabled: (enabled: boolean) => void;
  clearTrace: () => void;
  clearAll: () => void;
}

type ChatSetState = (
  partial: Partial<ChatStore> | ((state: ChatStore) => Partial<ChatStore>)
) => void;

