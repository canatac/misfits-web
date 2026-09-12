import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { UndoQueue, UndoableAction } from "@/lib/undo-destructive";

function makeAction(id: string, label = `action-${id}`, undo = vi.fn()): UndoableAction {
  return { id, label, undo: undo.mockResolvedValue(undefined) };
}

describe("UndoQueue", () => {
  let queue: UndoQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    queue = new UndoQueue();
  });

  afterEach(() => {
    queue.clear();
    vi.useRealTimers();
  });

  it("pushes actions and reports size", () => {
    expect(queue.push(makeAction("a"))).toBe(1);
    expect(queue.size).toBe(1);
    expect(queue.canUndo).toBe(true);
  });

  it("returns 0 size when empty", () => {
    expect(queue.size).toBe(0);
    expect(queue.canUndo).toBe(false);
  });

  it("pops the most recent action in LIFO order", async () => {
    queue.push(makeAction("1", "first"));
    queue.push(makeAction("2", "second"));
    expect(await queue.pop()).toBe("second");
    expect(queue.size).toBe(1);
  });

  it("invokes the undo callback once", async () => {
    const undoFn = vi.fn().mockResolvedValue(undefined);
    queue.push(makeAction("x", "do", undoFn));
    await queue.pop();
    expect(undoFn).toHaveBeenCalledOnce();
  });

  it("returns null when popping empty queue", async () => {
    expect(await queue.pop()).toBeNull();
  });

  it("peeks without removing", () => {
    queue.push(makeAction("p", "peek-label"));
    expect(queue.peek()?.label).toBe("peek-label");
    expect(queue.size).toBe(1);
  });

  it("expires entries after TTL", () => {
    queue.push({ ...makeAction("exp"), ttl: 500 });
    expect(queue.size).toBe(1);
    vi.advanceTimersByTime(600);
    expect(queue.size).toBe(0);
  });

  it("uses default TTL", () => {
    queue.push(makeAction("d"));
    vi.advanceTimersByTime(5999);
    expect(queue.size).toBe(1);
    vi.advanceTimersByTime(200);
    expect(queue.size).toBe(0);
  });

  it("clears all entries", () => {
    queue.push(makeAction("1"));
    queue.push(makeAction("2"));
    queue.clear();
    expect(queue.size).toBe(0);
    expect(queue.canUndo).toBe(false);
  });

  it("prunes expired on peek", () => {
    queue.push({ ...makeAction("1", "expired", vi.fn()), ttl: 100 });
    queue.push({ ...makeAction("2", "live", vi.fn()), ttl: 5000 });
    vi.advanceTimersByTime(200);
    expect(queue.peek()?.id).toBe("2");
    expect(queue.size).toBe(1);
  });
});
