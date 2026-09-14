import { describe, it, expect, vi } from 'vitest';
import {
  createChatSession,
  addMessage,
  getLastAssistantMessage,
  getChatHistory,
  formatChatPrompt,
  getMessagesByRole,
  clearChat,
  deleteMessage,
  summarizeChatSession,
  isSessionEmpty,
  type ChatSession,
} from '../chat-with-email';

describe('chat-with-email', () => {
  describe('createChatSession', () => {
    it('creates session with correct emailId', () => {
      const session = createChatSession('email-123');
      expect(session.emailId).toBe('email-123');
      expect(session.messages).toHaveLength(0);
    });

    it('generates unique id', () => {
      const s1 = createChatSession('a');
      const s2 = createChatSession('b');
      expect(s1.id).not.toBe(s2.id);
    });
  });

  describe('addMessage', () => {
    it('adds user message', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'What is this email about?');
      expect(session.messages).toHaveLength(1);
      expect(session.messages[0].role).toBe('user');
      expect(session.messages[0].content).toBe('What is this email about?');
    });

    it('adds multiple messages', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'Hello');
      session = addMessage(session, 'assistant', 'Hi!');
      expect(session.messages).toHaveLength(2);
    });

    it('includes emailRef in messages', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'Test');
      expect(session.messages[0].emailRef).toBe('email-1');
    });
  });

  describe('getLastAssistantMessage', () => {
    it('returns null when no messages', () => {
      const session = createChatSession('email-1');
      expect(getLastAssistantMessage(session)).toBeNull();
    });

    it('returns last assistant message', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'assistant', 'First');
      session = addMessage(session, 'user', 'Question');
      session = addMessage(session, 'assistant', 'Second');
      expect(getLastAssistantMessage(session)?.content).toBe('Second');
    });
  });

  describe('getChatHistory', () => {
    it('returns all messages', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'A');
      session = addMessage(session, 'assistant', 'B');
      expect(getChatHistory(session)).toHaveLength(2);
    });
  });

  describe('formatChatPrompt', () => {
    it('includes emailId in prompt', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'Summarize');
      const prompt = formatChatPrompt(session, 'What are the key points?');
      expect(prompt).toContain('email-1');
    });

    it('includes chat history', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'Hello');
      const prompt = formatChatPrompt(session, 'Follow up');
      expect(prompt).toContain('Hello');
    });
  });

  describe('getMessagesByRole', () => {
    it('filters by user role', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'Q1');
      session = addMessage(session, 'assistant', 'A1');
      session = addMessage(session, 'user', 'Q2');
      expect(getMessagesByRole(session, 'user')).toHaveLength(2);
    });
  });

  describe('clearChat', () => {
    it('removes all messages', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'Hello');
      session = clearChat(session);
      expect(session.messages).toHaveLength(0);
    });
  });

  describe('deleteMessage', () => {
    it('removes specific message', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'First');
      session = addMessage(session, 'user', 'Second');
      session = deleteMessage(session, 0);
      expect(session.messages).toHaveLength(1);
      expect(session.messages[0].content).toBe('Second');
    });

    it('does nothing for out-of-range index', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'A');
      session = deleteMessage(session, 5);
      expect(session.messages).toHaveLength(1);
    });
  });

  describe('summarizeChatSession', () => {
    it('returns session summary', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'Q');
      session = addMessage(session, 'assistant', 'A');
      const summary = summarizeChatSession(session);
      expect(summary).toContain('1 questions');
      expect(summary).toContain('1 responses');
    });
  });

  describe('isSessionEmpty', () => {
    it('returns true for empty session', () => {
      expect(isSessionEmpty(createChatSession('email-1'))).toBe(true);
    });

    it('returns false with messages', () => {
      let session = createChatSession('email-1');
      session = addMessage(session, 'user', 'Hello');
      expect(isSessionEmpty(session)).toBe(false);
    });
  });
});
