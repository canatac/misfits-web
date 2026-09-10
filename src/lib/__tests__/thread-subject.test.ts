/**
 * Unit tests for thread-subject.ts
 *
 * Covers: stripSubjectPrefix, normalizeSubject
 */
import { describe, it, expect } from "vitest";
import {
  stripSubjectPrefix,
  normalizeSubject,
} from "@/lib/thread-subject";

describe("stripSubjectPrefix", () => {
  it("strips a single Re: prefix", () => {
    expect(stripSubjectPrefix("Re: Hello world")).toBe("Hello world");
  });

  it("strips a single Fwd: prefix", () => {
    expect(stripSubjectPrefix("Fwd: Check this out")).toBe("Check this out");
  });

  it("strips a single Fw: prefix", () => {
    expect(stripSubjectPrefix("Fw: Forwarded message")).toBe(
      "Forwarded message"
    );
  });

  it("strips a single Aw: prefix (German)", () => {
    expect(stripSubjectPrefix("Aw: Betreff")).toBe("Betreff");
  });

  it("strips a single Wg: prefix (German)", () => {
    expect(stripSubjectPrefix("Wg: Weiterleitung")).toBe("Weiterleitung");
  });

  it("strips nested Re: Re: Re: prefixes", () => {
    expect(stripSubjectPrefix("Re: Re: Re: Original subject")).toBe(
      "Original subject"
    );
  });

  it("strips mixed Re: and Fwd: prefixes", () => {
    expect(stripSubjectPrefix("Re: Fwd: Re: Meeting notes")).toBe(
      "Meeting notes"
    );
  });

  it("is case-insensitive for prefix detection", () => {
    expect(stripSubjectPrefix("RE: Subject")).toBe("Subject");
    expect(stripSubjectPrefix("re: Subject")).toBe("Subject");
    expect(stripSubjectPrefix("FWD: Subject")).toBe("Subject");
    expect(stripSubjectPrefix("fwd: Subject")).toBe("Subject");
  });

  it("preserves subject with no prefix", () => {
    expect(stripSubjectPrefix("Hello world")).toBe("Hello world");
  });

  it("trims leading/trailing whitespace", () => {
    expect(stripSubjectPrefix("  Re:  Hello  ")).toBe("Hello");
  });

  it("handles empty string", () => {
    expect(stripSubjectPrefix("")).toBe("");
  });

  it("handles string with only prefix", () => {
    expect(stripSubjectPrefix("Re:")).toBe("");
  });

  it("handles prefix without space after colon", () => {
    expect(stripSubjectPrefix("Re:Subject")).toBe("Subject");
  });
});

describe("normalizeSubject", () => {
  it("lowercases the subject", () => {
    expect(normalizeSubject("HELLO WORLD")).toBe("hello world");
  });

  it("strips prefix and lowercases", () => {
    expect(normalizeSubject("Re: Hello World")).toBe("hello world");
  });

  it("trims whitespace", () => {
    expect(normalizeSubject("  Hello World  ")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(normalizeSubject("")).toBe("");
  });

  it("handles nested prefixes with mixed case", () => {
    expect(normalizeSubject("Re: RE: FWD: Original")).toBe("original");
  });

  it("handles German Aw: prefix", () => {
    expect(normalizeSubject("Aw: Betreff")).toBe("betreff");
  });

  it("handles Fw: prefix", () => {
    expect(normalizeSubject("Fw: Forwarded")).toBe("forwarded");
  });
});
