import { describe, it, expect } from "vitest";
import { DEFAULT_QUICK_REPLY_OPTIONS, QuickReplyState, createInitialQuickReplyState, formatRecipient, generateQuotedBody, generateReplySubject, isQuickReplyShortcut, parseEmailAddress, sanitizeReplyBody, validateQuickReply } from "@/lib/quick-reply";

describe("createInitialQuickReplyState", () => {
  it("creates state with recipient and subject", () => {
    const state = createInitialQuickReplyState("test@example.com", "Hello");
    expect(state.isOpen).toBe(false);
    expect(state.recipient).toBe("test@example.com");
    expect(state.subject).toBe("Re: Hello");
  });
  it("preserves Re: prefix if already present", () => {
    const state = createInitialQuickReplyState("test@example.com", "Re: Hello");
    expect(state.subject).toBe("Re: Hello");
  });
});

describe("generateReplySubject", () => {
  it("adds Re: prefix", () => {
    expect(generateReplySubject("Hello")).toBe("Re: Hello");
  });
  it("preserves existing Re: prefix", () => {
    expect(generateReplySubject("Re: Hello")).toBe("Re: Hello");
  });
  it("handles empty subject", () => {
    expect(generateReplySubject("")).toBe("Re: (no subject)");
  });
});

describe("generateQuotedBody", () => {
  it("generates quoted reply with header", () => {
    const body = generateQuotedBody("Original message", "John", "2024-01-01");
    expect(body).toContain("On 2024-01-01, John wrote:");
    expect(body).toContain("> Original message");
  });
});

describe("validateQuickReply", () => {
  it("validates complete reply", () => {
    const state: QuickReplyState = { isOpen: true, recipient: "test@example.com", subject: "Re: Hello", body: "Reply text", isSending: false, error: null };
    const result = validateQuickReply(state);
    expect(result.valid).toBe(true);
  });
  it("reports missing recipient", () => {
    const state = createInitialQuickReplyState("", "Hello");
    state.body = "Reply";
    const result = validateQuickReply(state);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Recipient is required");
  });
});

describe("parseEmailAddress", () => {
  it("extracts email from angle brackets", () => {
    expect(parseEmailAddress("John <john@example.com>")).toBe("john@example.com");
  });
  it("returns plain email as-is", () => {
    expect(parseEmailAddress("john@example.com")).toBe("john@example.com");
  });
});

describe("isQuickReplyShortcut", () => {
  it("returns true for r key", () => {
    expect(isQuickReplyShortcut("r")).toBe(true);
    expect(isQuickReplyShortcut("a")).toBe(false);
  });
});

describe("formatRecipient", () => {
  it("formats with name", () => {
    expect(formatRecipient("john@example.com", "John Doe")).toBe("John Doe <john@example.com>");
  });
  it("formats without name", () => {
    expect(formatRecipient("john@example.com")).toBe("john@example.com");
  });
});

describe("sanitizeReplyBody", () => {
  it("limits quote depth to 3", () => {
    expect(sanitizeReplyBody(">>>> Deep quote")).toBe("> Deep quote");
  });
});
