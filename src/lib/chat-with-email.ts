/**
 * Chat with Email (Conversational Mail via Hermes AI)
 *
 * Enables users to have a conversational interaction with their emails:
 * - Ask questions about an email in natural language
 * - Get summaries, action items, and key points
 * - Compose replies via chat interface
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  emailRef?: string;
}

export interface ChatSession {
  id: string;
  emailId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export function createChatSession(emailId: string): ChatSession {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    emailId,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function addMessage(session: ChatSession, role: ChatMessage['role'], content: string): ChatSession {
  const message: ChatMessage = {
    role,
    content,
    timestamp: Date.now(),
    emailRef: session.emailId,
  };

  return {
    ...session,
    messages: [...session.messages, message],
    updatedAt: Date.now(),
  };
}

export function getLastAssistantMessage(session: ChatSession): ChatMessage | null {
  const reversed = [...session.messages].reverse();
  return reversed.find(m => m.role === 'assistant') ?? null;
}

export function getChatHistory(session: ChatSession): ChatMessage[] {
  return session.messages;
}

export function formatChatPrompt(session: ChatSession, userMessage: string): string {
  const context = `You are a helpful email assistant. The user is asking about this email (ID: ${session.emailId}).`;
  const history = session.messages.map(m => `${m.role}: ${m.content}`).join('\n');
  return `${context}\n\nChat history:\n${history}\n\nUser: ${userMessage}`;
}

export function getSessionDuration(session: ChatSession): number {
  if (session.messages.length === 0) return 0;
  return session.updatedAt - session.createdAt;
}

export function getMessagesByRole(session: ChatSession, role: ChatMessage['role']): ChatMessage[] {
  return session.messages.filter(m => m.role === role);
}

export function clearChat(session: ChatSession): ChatSession {
  return {
    ...session,
    messages: [],
    updatedAt: Date.now(),
  };
}

export function deleteMessage(session: ChatSession, index: number): ChatSession {
  const messages = [...session.messages];
  if (index >= 0 && index < messages.length) {
    messages.splice(index, 1);
  }
  return {
    ...session,
    messages,
    updatedAt: Date.now(),
  };
}

export function summarizeChatSession(session: ChatSession): string {
  const userMessages = getMessagesByRole(session, 'user').length;
  const assistantMessages = getMessagesByRole(session, 'assistant').length;
  const duration = Math.round(getSessionDuration(session) / 1000);

  return `Session on email ${session.emailId}: ${userMessages} questions, ${assistantMessages} responses, ${duration}s duration`;
}

export function isSessionEmpty(session: ChatSession): boolean {
  return session.messages.length === 0;
}
