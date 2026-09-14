/**
 * Undo queue for destructive actions in the mail client.
 */
export interface UndoableAction {
  id: string;
  label: string;
  undo: () => Promise<void>;
  ttl?: number;
}

const DEFAULT_TTL_MS = 6000;

interface QueueEntry {
  action: UndoableAction;
  expiresAt: number;
}

export class UndoQueue {
  private queue: QueueEntry[] = [];
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  push(action: UndoableAction): number {
    const ttl = action.ttl ?? DEFAULT_TTL_MS;
    const expiresAt = Date.now() + ttl;
    this.queue.push({ action, expiresAt });
    const existing = this.timers.get(action.id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => this.expire(action.id), ttl + 50);
    this.timers.set(action.id, timer);
    return this.queue.length;
  }

  async pop(): Promise<string | null> {
    this.pruneExpired();
    const entry = this.queue.pop();
    if (!entry) return null;
    this.clearTimer(entry.action.id);
    await entry.action.undo();
    return entry.action.label;
  }

  peek(): UndoableAction | null {
    this.pruneExpired();
    const entry = this.queue.at(-1);
    return entry ? entry.action : null;
  }

  get size(): number {
    this.pruneExpired();
    return this.queue.length;
  }

  get canUndo(): boolean {
    return this.size > 0;
  }

  clear(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    this.queue = [];
  }

  private expire(id: string): void {
    this.clearTimer(id);
    this.queue = this.queue.filter((e) => e.action.id !== id);
  }

  private pruneExpired(): void {
    const now = Date.now();
    this.queue = this.queue.filter((e) => {
      if (e.expiresAt > now) return true;
      this.clearTimer(e.action.id);
      return false;
    });
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }
}

export const undoQueue = new UndoQueue();
