import { describe, it, expect } from "vitest";
import { DEFAULT_RECOVERY_OPTIONS, createErrorLogEntry, createInitialErrorState, formatErrorMessage, generateErrorId, getRetryDelay, isRecoverableError, parseError } from "@/lib/error-boundary";

describe("generateErrorId", () => {
  it("generates a unique error ID", () => {
    const id = generateErrorId();
    expect(id).toMatch(/^err_\d+_[a-z0-9]+$/);
  });
});

describe("parseError", () => {
  it("parses error with message and stack", () => {
    const error = new Error("Test error");
    const info = parseError(error);
    expect(info.message).toBe("Test error");
  });
});

describe("isRecoverableError", () => {
  it("returns true for NetworkError", () => {
    const e = new Error("fail"); e.name = "NetworkError";
    expect(isRecoverableError(e)).toBe(true);
  });
  it("returns false for SyntaxError", () => {
    expect(isRecoverableError(new SyntaxError("bad"))).toBe(false);
  });
});

describe("createInitialErrorState", () => {
  it("returns clean initial state", () => {
    const s = createInitialErrorState();
    expect(s.hasError).toBe(false);
    expect(s.error).toBeNull();
  });
});

describe("getRetryDelay", () => {
  it("exponential backoff, capped at 30s", () => {
    expect(getRetryDelay(0, 1000)).toBe(1000);
    expect(getRetryDelay(1, 1000)).toBe(2000);
    expect(getRetryDelay(10, 1000)).toBe(30000);
  });
});

describe("formatErrorMessage", () => {
  it("cleans error message", () => {
    expect(formatErrorMessage(new Error("Something broke"))).toBe("Something broke");
  });
});

describe("createErrorLogEntry", () => {
  it("creates complete entry", () => {
    const entry = createErrorLogEntry(new Error("e"), "err_1", { userId: "u1" });
    expect(entry.errorId).toBe("err_1");
  });
});
