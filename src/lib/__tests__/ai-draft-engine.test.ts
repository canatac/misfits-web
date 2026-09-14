import { describe, it, expect } from 'vitest';
import {
  generateDraftSuggestions,
  getGreeting,
  getSignOff,
  summarizeThread,
  type EmailContext,
} from '../ai-draft-engine';

describe('ai-draft-engine', () => {
  const baseContext: EmailContext = {
    subject: 'Test subject',
    from: 'sender@example.com',
    body: 'This is a test email body.',
  };

  describe('generateDraftSuggestions', () => {
    it('returns suggestions for meeting-related emails', () => {
      const ctx: EmailContext = { ...baseContext, subject: 'Meeting tomorrow?' };
      const suggestions = generateDraftSuggestions(ctx);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.text.toLowerCase().includes('meeting'))).toBe(true);
    });

    it('returns suggestions for thank-you emails', () => {
      const ctx: EmailContext = { ...baseContext, subject: 'Thank you!' };
      const suggestions = generateDraftSuggestions(ctx);
      expect(suggestions.some(s => s.tone === 'friendly')).toBe(true);
    });

    it('returns suggestions for follow-up emails', () => {
      const ctx: EmailContext = { ...baseContext, subject: 'Following up on our discussion' };
      const suggestions = generateDraftSuggestions(ctx);
      expect(suggestions.some(s => s.text.toLowerCase().includes('follow up'))).toBe(true);
    });

    it('sorts suggestions by confidence descending', () => {
      const ctx: EmailContext = { ...baseContext, subject: 'Thank you for the meeting' };
      const suggestions = generateDraftSuggestions(ctx);
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence);
      }
    });

    it('limits suggestions to maximum 3', () => {
      const ctx: EmailContext = { ...baseContext, subject: 'Meeting follow up question request' };
      const suggestions = generateDraftSuggestions(ctx);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getGreeting', () => {
    it('extracts name from email address', () => {
      expect(getGreeting('John Doe <john@example.com>')).toContain('John');
    });

    it('uses "Hi" for replies', () => {
      expect(getGreeting('sender@example.com', true)).toMatch(/^Hi/);
    });

    it('uses "Dear" for new emails', () => {
      expect(getGreeting('sender@example.com', false)).toMatch(/^Dear/);
    });
  });

  describe('getSignOff', () => {
    it('returns correct sign-off per tone', () => {
      expect(getSignOff('formal')).toBe('Best regards,');
      expect(getSignOff('casual')).toBe('Thanks,');
      expect(getSignOff('friendly')).toBe('Cheers,');
      expect(getSignOff('concise')).toBe('—');
    });
  });

  describe('summarizeThread', () => {
    it('returns empty string for empty array', () => {
      expect(summarizeThread([])).toBe('');
    });

    it('includes subject from last email', () => {
      const emails: EmailContext[] = [
        { subject: 'First', from: 'a@test.com', body: 'body1' },
        { subject: 'Last', from: 'b@test.com', body: 'body2' },
      ];
      expect(summarizeThread(emails)).toContain('Last');
    });
  });
});
