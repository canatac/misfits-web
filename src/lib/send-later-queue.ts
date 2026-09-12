export interface ScheduledEmail { id: string; to: string[]; subject: string; body: string; scheduledAt: number }
export interface QueueStats { total: number; nextScheduledAt: number | null }
export class SendLaterQueue {
  private items: ScheduledEmail[] = [];
  enqueue(email: ScheduledEmail): void {
    this.items.push(email);
    this.items.sort((a, b) => a.scheduledAt - b.scheduledAt);
  }
  dequeue(now: number = Date.now()): ScheduledEmail | null {
    if (this.items.length === 0) return null;
    if (this.items[0].scheduledAt <= now) return this.items.shift()!;
    return null;
  }
  dequeueDue(now: number = Date.now()): ScheduledEmail[] {
    const due: ScheduledEmail[] = [];
    while (this.items.length > 0 && this.items[0].scheduledAt <= now) {
      due.push(this.items.shift()!);
    }
    return due;
  }
  cancel(id: string): boolean {
    const idx = this.items.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }
  peek(): ScheduledEmail | null { return this.items[0] ?? null; }
  getAll(): ScheduledEmail[] { return [...this.items]; }
  get size(): number { return this.items.length; }
  stats(): QueueStats { return { total: this.items.length, nextScheduledAt: this.items[0]?.scheduledAt ?? null }; }
  clear(): void { this.items = []; }
}
export const sendLaterQueue = new SendLaterQueue();
