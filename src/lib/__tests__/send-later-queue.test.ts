/**
 * Unit tests for send later queue.
 */
import { describe, it, expect } from "vitest";
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
} from "@/lib/send-later-queue";

const SAMPLE_EMAIL = {
  id: "e1",
  subject: "Hello",
  recipient: "test@example.com",
  body: "Body",
  scheduledAt: "2026-09-10T10:00:00Z",
  status: "pending" as const,
};

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
