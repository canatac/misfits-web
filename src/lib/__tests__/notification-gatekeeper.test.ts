import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRule,
  shouldNotify,
  filterNotifications,
  isSenderWhitelisted,
  isSenderBlacklisted,
  type NotificationRule,
  type NotificationContext,
} from '../notification-gatekeeper';

const ctx: NotificationContext = {
  sender: 'boss@company.com',
  subject: 'Urgent meeting',
  folder: 'inbox',
};

describe('notification-gatekeeper', () => {
  describe('createRule', () => {
    it('creates a rule with correct fields', () => {
      const rule = createRule('allow', 'sender', 'boss@company.com');
      expect(rule.type).toBe('allow');
      expect(rule.field).toBe('sender');
      expect(rule.pattern).toBe('boss@company.com');
      expect(rule.enabled).toBe(true);
    });

    it('generates a unique id', () => {
      const r1 = createRule('allow', 'sender', 'a');
      const r2 = createRule('allow', 'sender', 'b');
      expect(r1.id).not.toBe(r2.id);
    });

    it('lowercases the pattern', () => {
      const rule = createRule('allow', 'subject', 'URGENT');
      expect(rule.pattern).toBe('urgent');
    });
  });

  describe('shouldNotify', () => {
    it('returns true with no rules (default)', () => {
      expect(shouldNotify(ctx, [], false)).toBe(true);
    });

    it('blocks sender when matching block rule exists', () => {
      const rules: NotificationRule[] = [
        createRule('block', 'sender', 'spam@evil.com'),
      ];
      const spamCtx: NotificationContext = { ...ctx, sender: 'spam@evil.com' };
      expect(shouldNotify(spamCtx, rules, false)).toBe(false);
    });

    it('allows sender when matching allow rule exists', () => {
      const rules: NotificationRule[] = [
        createRule('allow', 'sender', 'boss@company.com'),
      ];
      expect(shouldNotify(ctx, rules, false)).toBe(true);
    });

    it('blocks even if allowed, when block rule matches', () => {
      const rules: NotificationRule[] = [
        createRule('allow', 'sender', 'boss@company.com'),
        createRule('block', 'subject', 'meeting'),
      ];
      expect(shouldNotify(ctx, rules, false)).toBe(false);
    });

    it('supports wildcard patterns', () => {
      const rules: NotificationRule[] = [
        createRule('block', 'sender', '*@evil.com'),
      ];
      const spamCtx: NotificationContext = { ...ctx, sender: 'phish@evil.com' };
      expect(shouldNotify(spamCtx, rules, false)).toBe(false);
    });

    it('checks folder field', () => {
      const rules: NotificationRule[] = [
        createRule('block', 'folder', 'promotions'),
      ];
      const promoCtx: NotificationContext = { ...ctx, folder: 'promotions' };
      expect(shouldNotify(promoCtx, rules, false)).toBe(false);
    });

    it('ignores disabled rules', () => {
      const rule = createRule('block', 'sender', 'boss@company.com');
      rule.enabled = false;
      expect(shouldNotify(ctx, [rule], false)).toBe(true);
    });

    describe('focus mode', () => {
      it('blocks everything except whitelisted in focus mode', () => {
        const rules: NotificationRule[] = [
          createRule('allow', 'sender', 'boss@company.com'),
        ];
        const randomCtx: NotificationContext = {
          sender: 'random@example.com',
          subject: 'Hello',
          folder: 'inbox',
        };
        expect(shouldNotify(randomCtx, rules, true)).toBe(false);
      });

      it('allows whitelisted sender in focus mode', () => {
        const rules: NotificationRule[] = [
          createRule('allow', 'sender', 'boss@company.com'),
        ];
        expect(shouldNotify(ctx, rules, true)).toBe(true);
      });

      it('allows starred emails in focus mode', () => {
        const starredCtx: NotificationContext = {
          sender: 'random@example.com',
          subject: 'Newsletter',
          folder: 'inbox',
          isStarred: true,
        };
        expect(shouldNotify(starredCtx, [], true)).toBe(true);
      });
    });
  });

  describe('filterNotifications', () => {
    it('filters out blocked notifications', () => {
      const rules: NotificationRule[] = [
        createRule('block', 'sender', 'spam@evil.com'),
      ];
      const contexts: NotificationContext[] = [
        { sender: 'spam@evil.com', subject: 'Buy now', folder: 'inbox' },
        { sender: 'boss@company.com', subject: 'Meeting', folder: 'inbox' },
      ];
      const result = filterNotifications(contexts, rules, false);
      expect(result).toHaveLength(1);
      expect(result[0].sender).toBe('boss@company.com');
    });

    it('returns all when no rules match', () => {
      const contexts: NotificationContext[] = [
        { sender: 'a@x.com', subject: 'A', folder: 'inbox' },
        { sender: 'b@x.com', subject: 'B', folder: 'inbox' },
      ];
      expect(filterNotifications(contexts, [], false)).toHaveLength(2);
    });

    it('returns empty when all blocked', () => {
      const rules: NotificationRule[] = [
        createRule('block', 'folder', 'inbox'),
      ];
      const contexts: NotificationContext[] = [
        { sender: 'a@x.com', subject: 'A', folder: 'inbox' },
      ];
      expect(filterNotifications(contexts, rules, false)).toHaveLength(0);
    });
  });

  describe('isSenderWhitelisted', () => {
    it('returns true when allow rule matches', () => {
      const rules: NotificationRule[] = [
        createRule('allow', 'sender', 'boss@company.com'),
      ];
      expect(isSenderWhitelisted('boss@company.com', rules)).toBe(true);
    });

    it('returns false when no allow rule matches', () => {
      const rules: NotificationRule[] = [
        createRule('allow', 'sender', 'boss@company.com'),
      ];
      expect(isSenderWhitelisted('random@evil.com', rules)).toBe(false);
    });

    it('returns false for disabled allow rule', () => {
      const rule = createRule('allow', 'sender', 'boss@company.com');
      rule.enabled = false;
      expect(isSenderWhitelisted('boss@company.com', [rule])).toBe(false);
    });
  });

  describe('isSenderBlacklisted', () => {
    it('returns true when block rule matches', () => {
      const rules: NotificationRule[] = [
        createRule('block', 'sender', 'spam@evil.com'),
      ];
      expect(isSenderBlacklisted('spam@evil.com', rules)).toBe(true);
    });

    it('returns false when no block rule matches', () => {
      const rules: NotificationRule[] = [
        createRule('block', 'sender', 'spam@evil.com'),
      ];
      expect(isSenderBlacklisted('boss@company.com', rules)).toBe(false);
    });
  });
});
