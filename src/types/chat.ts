/**
 * Chat types for the conversational AI mail assistant.
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
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
}
