import { describe, expect, it } from "vitest";
import {
  createQueuedEmail,
  dequeueDue,
  deserializeQueue,
  isValidQueuedEmail,
  markFailed,
  markProcessing,
  markSent,
  retryFailed,
  serializeQueue,
} from "@/lib/send-later-queue";

function makeDraft() {
  return {
    to: ["user@example.com"],
    subject: "Hello",
    body: "<p>World</p>",
    bodyType: "html" as const,
  };
}

describe("send-later-queue", () => {
  it("creates a queued email with defaults", () => {
    const draft = makeDraft();
    const item = createQueuedEmail(draft, "2027-01-01T00:00:00.000Z");
    expect(item.id).toBeTruthy();
    expect(item.draft).toEqual(draft);
    expect(item.scheduledAt).toBe("2027-01-01T00:00:00.000Z");
    expect(item.status).toBe("pending");
    expect(item.attempts).toBe(0);
  });

  it("dequeues only pending and due items", () => {
    const now = new Date("2027-01-01T12:00:00.000Z");
    const past = createQueuedEmail(makeDraft(), "2027-01-01T10:00:00.000Z");
    const future = createQueuedEmail(makeDraft(), "2027-01-02T00:00:00.000Z");
    const sent = markSent(createQueuedEmail(makeDraft(), "2027-01-01T09:00:00.000Z"));

    const due = dequeueDue([past, future, sent], now);
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe(past.id);
  });

  it("sorts dequeued items by scheduledAt ascending", () => {
    const now = new Date("2027-01-01T12:00:00.000Z");
    const late = createQueuedEmail(makeDraft(), "2027-01-01T11:00:00.000Z");
    const early = createQueuedEmail(makeDraft(), "2027-01-01T09:00:00.000Z");
    const due = dequeueDue([late, early], now);
    expect(due[0].id).toBe(early.id);
    expect(due[1].id).toBe(late.id);
  });

  it("marks item as processing", () => {
    const item = createQueuedEmail(makeDraft(), "2027-01-01T00:00:00.000Z");
    expect(markProcessing(item).status).toBe("processing");
  });

  it("marks item as sent", () => {
    const item = createQueuedEmail(makeDraft(), "2027-01-01T00:00:00.000Z");
    expect(markSent(item).status).toBe("sent");
  });

  it("marks item as failed and increments attempts", () => {
    const item = createQueuedEmail(makeDraft(), "2027-01-01T00:00:00.000Z");
    const failed = markFailed(item, "timeout");
    expect(failed.status).toBe("failed");
    expect(failed.attempts).toBe(1);
    expect(failed.error).toBe("timeout");
  });

  it("retries a failed entry", () => {
    const item = createQueuedEmail(makeDraft(), "2027-01-01T00:00:00.000Z");
    const failed = markFailed(item);
    const retried = retryFailed(failed);
    expect(retried?.status).toBe("pending");
    expect(retried?.error).toBeUndefined();
  });

  it("does not retry non-failed entries", () => {
    const item = createQueuedEmail(makeDraft(), "2027-01-01T00:00:00.000Z");
    expect(retryFailed(item)).toBeNull();
  });

  it("validates QueuedEmail shape", () => {
    expect(isValidQueuedEmail(null)).toBe(false);
    expect(isValidQueuedEmail({})).toBe(false);
    const valid = createQueuedEmail(makeDraft(), "2027-01-01T00:00:00.000Z");
    expect(isValidQueuedEmail(valid)).toBe(true);
  });

  it("serializes and deserializes a queue", () => {
    const items = [
      createQueuedEmail(makeDraft(), "2027-01-01T00:00:00.000Z"),
      createQueuedEmail(makeDraft(), "2027-01-02T00:00:00.000Z"),
    ];
    const json = serializeQueue(items);
    const restored = deserializeQueue(json);
    expect(restored).toHaveLength(2);
    expect(restored[0].id).toBe(items[0].id);
    expect(restored[1].draft.subject).toBe(items[1].draft.subject);
  });

  it("deserialize returns empty array for invalid JSON", () => {
    expect(deserializeQueue("not json")).toEqual([]);
  });

  it("deserialize filters out malformed entries", () => {
    const json = JSON.stringify({ items: [{ id: "x" }, { bad: true }] });
    expect(deserializeQueue(json)).toEqual([]);
  });
});
