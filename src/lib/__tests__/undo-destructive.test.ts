import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { undoManager, createUndoableAction, UndoableAction } from '../undo-destructive';

vi.useFakeTimers();

describe('undo-destructive', () => {
  beforeEach(() => {
    undoManager.clearAll();
  });

  afterEach(() => {
    undoManager.clearAll();
    vi.useFakeTimers();
  });

  describe('createUndoableAction', () => {
    it('creates an action with all required fields', () => {
      const action = createUndoableAction('archive', 'Archived email', async () => {});
      expect(action.id).toContain('archive-');
      expect(action.type).toBe('archive');
      expect(action.description).toBe('Archived email');
      expect(typeof action.undo).toBe('function');
      expect(action.expiresAt).toBeGreaterThan(Date.now());
    });

    it('generates unique IDs for each action', () => {
      const a = createUndoableAction('delete', 'd1', async () => {});
      const b = createUndoableAction('delete', 'd2', async () => {});
      expect(a.id).not.toBe(b.id);
    });

    it('supports all destructive action types', () => {
      const archive = createUndoableAction('archive', '', async () => {});
      const del = createUndoableAction('delete', '', async () => {});
      const label = createUndoableAction('label-remove', '', async () => {});
      expect(archive.type).toBe('archive');
      expect(del.type).toBe('delete');
      expect(label.type).toBe('label-remove');
    });
  });

  describe('undoManager.register', () => {
    it('registers an action that can be retrieved', () => {
      const action = createUndoableAction('archive', 'test', async () => {});
      undoManager.register(action);
      expect(undoManager.get(action.id)).toBeDefined();
      expect(undoManager.get(action.id)?.type).toBe('archive');
    });

    it('expires the action after the undo window', () => {
      const action = createUndoableAction('delete', 'expiring', async () => {});
      undoManager.register(action);
      expect(undoManager.get(action.id)).toBeDefined();
      vi.advanceTimersByTime(8001);
      expect(undoManager.get(action.id)).toBeUndefined();
    });
  });

  describe('undoManager.undo', () => {
    it('executes the undo callback and removes the action', async () => {
      const undoFn = vi.fn();
      const action = createUndoableAction('archive', 'reversible', undoFn);
      undoManager.register(action);
      const result = await undoManager.undo(action.id);
      expect(result).toBe(true);
      expect(undoFn).toHaveBeenCalledOnce();
      expect(undoManager.get(action.id)).toBeUndefined();
    });

    it('returns false when undoing an expired/nonexistent action', async () => {
      const result = await undoManager.undo('nonexistent-id');
      expect(result).toBe(false);
    });

    it('clears the expiration timer when undone early', async () => {
      const undoFn = vi.fn();
      const action = createUndoableAction('delete', 'cancel timer', undoFn);
      undoManager.register(action);
      await undoManager.undo(action.id);
      // Advance past the original expiry — should not crash
      vi.advanceTimersByTime(10000);
      expect(undoFn).toHaveBeenCalledOnce();
    });
  });

  describe('undoManager.list', () => {
    it('returns all active actions', () => {
      const a = createUndoableAction('archive', 'a', async () => {});
      const b = createUndoableAction('delete', 'b', async () => {});
      undoManager.register(a);
      undoManager.register(b);
      const list = undoManager.list();
      expect(list).toHaveLength(2);
      expect(list.map((item: UndoableAction) => item.id)).toEqual(expect.arrayContaining([a.id, b.id]));
    });

    it('returns empty array when no actions registered', () => {
      expect(undoManager.list()).toEqual([]);
    });
  });

  describe('undoManager.timeRemaining', () => {
    it('returns positive ms before expiry', () => {
      const action = createUndoableAction('archive', '', async () => {});
      undoManager.register(action);
      vi.advanceTimersByTime(2000);
      const remaining = undoManager.timeRemaining(action.id);
      expect(remaining).toBeLessThanOrEqual(6000);
      expect(remaining).toBeGreaterThan(0);
    });

    it('returns 0 for nonexistent action', () => {
      expect(undoManager.timeRemaining('nope')).toBe(0);
    });
  });

  describe('undoManager.undoWindowMs', () => {
    it('is 8000 ms', () => {
      expect(undoManager.undoWindowMs).toBe(8000);
    });
  });
});
