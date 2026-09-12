import { describe, it, expect } from 'vitest';
import {
  parseUnsubscribeHeader,
  isUnsubscribeUrlSafe,
  getUnsubscribeLink,
} from '../newsletter-unsubscribe';

describe('newsletter-unsubscribe', () => {
  describe('parseUnsubscribeHeader', () => {
    it('parses mailto link', () => {
      const info = parseUnsubscribeHeader('<mailto:unsubscribe@example.com>');
      expect(info).not.toBeNull();
      expect(info?.isMailto).toBe(true);
      expect(info?.email).toBe('unsubscribe@example.com');
    });

    it('parses https link', () => {
      const info = parseUnsubscribeHeader('<https://example.com/unsubscribe>');
      expect(info).not.toBeNull();
      expect(info?.isMailto).toBe(false);
      expect(info?.url).toBe('https://example.com/unsubscribe');
    });

    it('detects one-click', () => {
      const info = parseUnsubscribeHeader('<mailto:unsubscribe@example.com>, List-Unsubscribe=One-Click');
      expect(info?.isOneClick).toBe(true);
    });

    it('returns null for empty header', () => {
      expect(parseUnsubscribeHeader('')).toBeNull();
    });
  });

  describe('isUnsubscribeUrlSafe', () => {
    it('accepts https', () => {
      expect(isUnsubscribeUrlSafe('https://example.com/unsubscribe')).toBe(true);
    });

    it('accepts mailto', () => {
      expect(isUnsubscribeUrlSafe('mailto:test@example.com')).toBe(true);
    });

    it('rejects javascript', () => {
      expect(isUnsubscribeUrlSafe('javascript:alert(1)')).toBe(false);
    });

    it('rejects invalid url', () => {
      expect(isUnsubscribeUrlSafe('not-a-url')).toBe(false);
    });
  });

  describe('getUnsubscribeLink', () => {
    it('extracts from headers', () => {
      const headers = { 'list-unsubscribe': '<https://example.com/unsub>' };
      expect(getUnsubscribeLink(headers)).toBe('https://example.com/unsub');
    });

    it('returns null when no header', () => {
      expect(getUnsubscribeLink({})).toBeNull();
    });
  });
});
