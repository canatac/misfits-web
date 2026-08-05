/**
 * Chat types for the conversational AI mail assistant.
 */

export interface ChatSourceCitation {
  label: string;
  value: string;
  kind?: "email" | "thread" | "folder" | "attachment";
}

export interface ChatMessageMetadata {
  trace?: boolean;
  confidence?: "high" | "medium" | "low";
  confidenceReason?: string;
  sources?: ChatSourceCitation[];
  latencyMs?: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  metadata?: ChatMessageMetadata & Record<string, unknown>;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatContext {
  currentEmailId?: string;
  currentFolder?: string;
  selectedEmails?: string[];
  threadId?: string;
  userId?: string;
  sessionId?: string;
  sessionKey?: string;
  attachmentNames?: string[];
}
