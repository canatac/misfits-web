// Undo for destructive actions (archive, delete, label removal).
// Issue #437: Undo for all destructive actions

export interface UndoableAction {
  id: string;
  type: 'archive' | 'delete' | 'label-remove';
  description: string;
  undo: () => Promise<void>;
  expiresAt: number;
}

const UNDO_WINDOW_MS = 8000;

class UndoManager {
  private actions: Map<string, UndoableAction> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  register(action: UndoableAction): void {
    this.actions.set(action.id, action);
    const timer = setTimeout(() => {
      this.actions.delete(action.id);
      this.timers.delete(action.id);
    }, action.expiresAt - Date.now());
    this.timers.set(action.id, timer);
  }

  get(id: string): UndoableAction | undefined {
    return this.actions.get(id);
  }

  async undo(id: string): Promise<boolean> {
    const action = this.actions.get(id);
    if (!action) return false;
    await action.undo();
    this.actions.delete(id);
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    return true;
  }

  clear(id: string): void {
    this.actions.delete(id);
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  clearAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.actions.clear();
    this.timers.clear();
  }

  list(): UndoableAction[] {
    return Array.from(this.actions.values());
  }

  timeRemaining(id: string): number {
    const action = this.actions.get(id);
    if (!action) return 0;
    return Math.max(0, action.expiresAt - Date.now());
  }

  get undoWindowMs(): number {
    return UNDO_WINDOW_MS;
  }
}

export const undoManager = new UndoManager();

export function createUndoableAction(
  type: UndoableAction['type'],
  description: string,
  undo: () => Promise<void>
): UndoableAction {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    description,
    undo,
    expiresAt: Date.now() + UNDO_WINDOW_MS,
  };
}
