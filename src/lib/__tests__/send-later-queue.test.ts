/**
 * Unit tests for send later queue.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createQueue,
  addToQueue,
  removeFromQueue,
  cancelScheduled,
  sendNow,
  getPendingEmails,
  getPendingCount,
  hasPendingEmails,
  getEmailById,
  updateScheduledEmail,
  SendLaterQueue
} from "@/lib/send-later-queue";

const SAMPLE_EMAIL = {
  id: "e1",
  subject: "Hello",
  recipient: "test@example.com",
  body: "Body",
  scheduledAt: "2026-09-10T10:00:00Z",
  status: "pending" as const,
};


describe("SendLaterQueue", () => {
  let queue: SendLaterQueue;
  
  beforeEach(() => { queue = new SendLaterQueue(); });
  
  const email = (id: string, ts: number) => ({ id, to: ["to@test.com"], subject: "Hi", body: "Body", scheduledAt: ts });
  
  it("enqueues and sorts", () => { 
    queue.enqueue(email("b", 200)); 
    queue.enqueue(email("a", 100)); 
    expect(queue.peek()?.id).toBe("a"); 
    expect(queue.getAll().map(e=>e.id)).toEqual(["a","b"]); 
  });
  
  it("dequeues only due", () => { 
    queue.enqueue(email("future", Date.now()+10000)); 
    expect(queue.dequeue()).toBeNull(); 
  });
  
  it("dequeues due items", () => { 
    queue.enqueue(email("past", Date.now()-1000)); 
    expect(queue.dequeue()?.id).toBe("past"); 
    expect(queue.size).toBe(0); 
  });
  
  it("dequeueDue multiple", () => { 
    queue.enqueue(email("a",100)); 
    queue.enqueue(email("b",200)); 
    queue.enqueue(email("c",9999999999999)); 
    const due = queue.dequeueDue(250); 
    expect(due.map(e=>e.id)).toEqual(["a","b"]); 
    expect(queue.size).toBe(1); 
  });
  
  it("cancel", () => { 
    queue.enqueue(email("k",100)); 
    queue.enqueue(email("c",200)); 
    expect(queue.cancel("c")).toBe(true); 
    expect(queue.size).toBe(1); 
    expect(queue.getAll()[0].id).toBe("k"); 
  });
  
  it("cancel missing", () => { 
    expect(queue.cancel("missing")).toBe(false); 
  });
  
  it("peek no remove", () => { 
    queue.enqueue(email("f",100)); 
    expect(queue.peek()?.id).toBe("f"); 
    expect(queue.size).toBe(1); 
  });
  
  it("stats", () => { 
    queue.enqueue(email("a",500)); 
    const s = queue.stats(); 
    expect(s.total).toBe(1); 
    expect(s.nextScheduledAt).toBe(500); 
  });
  
  it("clear", () => { 
    queue.enqueue(email("a",100)); 
    queue.clear(); 
    expect(queue.size).toBe(0); 
  });
});

describe("send-later-queue", () => {
  describe("createQueue", () => {
    it("creates empty queue", () => {
      const queue = createQueue();
      expect(queue.emails).toEqual([]);
    });
  });

  describe("addToQueue", () => {
    it("adds email", () => {
      let queue = createQueue();
      queue = addToQueue(queue, SAMPLE_EMAIL);
      expect(queue.emails).toHaveLength(1);
    });
  });

  describe("removeFromQueue", () => {
    it("removes email", () => {
      let queue = createQueue();
      queue = addToQueue(queue, SAMPLE_EMAIL);
      queue = removeFromQueue(queue, "e1");
      expect(queue.emails).toHaveLength(0);
    });
  });

  describe("cancelScheduled", () => {
    it("cancels email", () => {
      let queue = createQueue();
      queue = addToQueue(queue, SAMPLE_EMAIL);
      queue = cancelScheduled(queue, "e1");
      expect(queue.emails[0].status).toBe("cancelled");
    });
  });

  describe("sendNow", () => {
    it("marks as sent", () => {
      let queue = createQueue();
      queue = addToQueue(queue, SAMPLE_EMAIL);
      queue = sendNow(queue, "e1");
      expect(queue.emails[0].status).toBe("sent");
    });
  });

  describe("getPendingEmails", () => {
    it("returns pending", () => {
      let queue = createQueue();
      queue = addToQueue(queue, SAMPLE_EMAIL);
      expect(getPendingEmails(queue)).toHaveLength(1);
    });
  });

  describe("getPendingCount", () => {
    it("returns count", () => {
      let queue = createQueue();
      queue = addToQueue(queue, SAMPLE_EMAIL);
      expect(getPendingCount(queue)).toBe(1);
    });
  });

  describe("hasPendingEmails", () => {
    it("returns true when pending", () => {
      let queue = createQueue();
      queue = addToQueue(queue, SAMPLE_EMAIL);
      expect(hasPendingEmails(queue)).toBe(true);
    });

    it("returns false when empty", () => {
      const queue = createQueue();
      expect(hasPendingEmails(queue)).toBe(false);
    });
  });

  describe("getEmailById", () => {
    it("returns email", () => {
      let queue = createQueue();
      queue = addToQueue(queue, SAMPLE_EMAIL);
      expect(getEmailById(queue, "e1")).toEqual(SAMPLE_EMAIL);
    });
  });

  describe("updateScheduledEmail", () => {
    it("updates email", () => {
      let queue = createQueue();
      queue = addToQueue(queue, SAMPLE_EMAIL);
      queue = updateScheduledEmail(queue, "e1", { subject: "Updated" });
      expect(queue.emails[0].subject).toBe("Updated");
    });
  });

});
