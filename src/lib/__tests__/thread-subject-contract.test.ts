/**
 * Integration test: Thread subject normalization contract.
 *
 * thread-subject.ts normalizes email subjects for thread grouping.
 * This test verifies the contract between subject normalization
 * and the thread builder's grouping expectations.
 */
import { describe, it, expect } from "vitest";
import { stripSubjectPrefix, normalizeSubject } from "@/lib/thread-subject";

describe("Thread subject normalization contract", () => {
  it("strips Re: prefix", () => {
    expect(stripSubjectPrefix("Re: Hello")).toBe("Hello");
  });

  it("strips Fwd: prefix", () => {
    expect(stripSubjectPrefix("Fwd: Hello")).toBe("Hello");
  });

  it("strips Fw: prefix", () => {
    expect(stripSubjectPrefix("Fw: Hello")).toBe("Hello");
  });

  it("strips Aw: prefix (German)", () => {
    expect(stripSubjectPrefix("Aw: Hello")).toBe("Hello");
  });

  it("strips Wg: prefix (German)", () => {
    expect(stripSubjectPrefix("Wg: Hello")).toBe("Hello");
  });

  it("strips nested Re: Re: Re:", () => {
    expect(stripSubjectPrefix("Re: Re: Re: Hello")).toBe("Hello");
  });

  it("strips mixed case prefixes", () => {
    expect(stripSubjectPrefix("RE: Hello")).toBe("Hello");
    expect(stripSubjectPrefix("re: Hello")).toBe("Hello");
    expect(stripSubjectPrefix("FWD: Hello")).toBe("Hello");
  });

  it("normalizeSubject lowercases and strips", () => {
    expect(normalizeSubject("Re: Hello World")).toBe("hello world");
  });

  it("normalizeSubject trims whitespace", () => {
    expect(normalizeSubject("  Re:  Hello  ")).toBe("hello");
  });

  it("handles subject without prefix", () => {
    expect(stripSubjectPrefix("Hello")).toBe("Hello");
    expect(normalizeSubject("Hello")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(stripSubjectPrefix("")).toBe("");
    expect(normalizeSubject("")).toBe("");
  });
});
