import { describe, it, expect, beforeEach } from "vitest";
import { SendLaterQueue } from "@/lib/send-later-queue";
describe("SendLaterQueue", () => {
  let queue: SendLaterQueue;
  beforeEach(() => { queue = new SendLaterQueue(); });
  const email = (id: string, ts: number) => ({ id, to: ["to@test.com"], subject: "Hi", body: "Body", scheduledAt: ts });
  it("enqueues and sorts", () => { queue.enqueue(email("b", 200)); queue.enqueue(email("a", 100)); expect(queue.peek()?.id).toBe("a"); expect(queue.getAll().map(e=>e.id)).toEqual(["a","b"]); });
  it("dequeues only due", () => { queue.enqueue(email("future", Date.now()+10000)); expect(queue.dequeue()).toBeNull(); });
  it("dequeues due items", () => { queue.enqueue(email("past", Date.now()-1000)); expect(queue.dequeue()?.id).toBe("past"); expect(queue.size).toBe(0); });
  it("dequeueDue multiple", () => { queue.enqueue(email("a",100)); queue.enqueue(email("b",200)); queue.enqueue(email("c",9999999999999)); const due = queue.dequeueDue(250); expect(due.map(e=>e.id)).toEqual(["a","b"]); expect(queue.size).toBe(1); });
  it("cancel", () => { queue.enqueue(email("k",100)); queue.enqueue(email("c",200)); expect(queue.cancel("c")).toBe(true); expect(queue.size).toBe(1); expect(queue.getAll()[0].id).toBe("k"); });
  it("cancel missing", () => { expect(queue.cancel("missing")).toBe(false); });
  it("peek no remove", () => { queue.enqueue(email("f",100)); expect(queue.peek()?.id).toBe("f"); expect(queue.size).toBe(1); });
  it("stats", () => { queue.enqueue(email("a",500)); const s = queue.stats(); expect(s.total).toBe(1); expect(s.nextScheduledAt).toBe(500); });
  it("clear", () => { queue.enqueue(email("a",100)); queue.clear(); expect(queue.size).toBe(0); });
});
