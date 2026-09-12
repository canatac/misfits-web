import { describe, expect, it } from "vitest";
import { buildArchiveAction, shouldArchiveAfterSend, type SendArchiveOptions } from "@/lib/send-archive";

const base: SendArchiveOptions = {
  mode: "always",
  fromEmail: "me@example.com",
  allRecipientsAreContacts: true,
};

describe("send-archive", () => {
  it("always mode archives regardless of contacts", () => {
    const d = shouldArchiveAfterSend({ ...base, mode: "always" });
    expect(d.shouldArchive).toBe(true);
  });

  it("never mode never archives", () => {
    const d = shouldArchiveAfterSend({ ...base, mode: "never" });
    expect(d.shouldArchive).toBe(false);
  });

  it("non-contacts mode archives when there is a non-contact recipient", () => {
    const d = shouldArchiveAfterSend({ ...base, mode: "non-contacts", allRecipientsAreContacts: false });
    expect(d.shouldArchive).toBe(true);
  });

  it("non-contacts mode skips when all are contacts", () => {
    const d = shouldArchiveAfterSend({ ...base, mode: "non-contacts", allRecipientsAreContacts: true });
    expect(d.shouldArchive).toBe(false);
  });

  it("buildArchiveAction returns correct payload", () => {
    const a = buildArchiveAction("msg-1");
    expect(a).toEqual({ action: "move", destination: "Archive", messageId: "msg-1" });
  });
});
