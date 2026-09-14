import { describe, it, expect } from "vitest";
import { extractDomain, isExternal, classifyRecipients, buildExternalWarning, formatExternalWarning } from "@/lib/external-recipient-warning";
const INTERNAL = "misfits.ai";
describe("extractDomain", () => {
  it("extracts lowercase domain", () => { expect(extractDomain("User@Example.COM")).toBe("example.com"); });
  it("returns null for invalid", () => { expect(extractDomain("not-an-email")).toBeNull(); expect(extractDomain("user@")).toBeNull(); });
});
describe("isExternal", () => {
  it("false for internal", () => { expect(isExternal("a@misfits.ai", INTERNAL)).toBe(false); });
  it("false for subdomain", () => { expect(isExternal("a@sub.misfits.ai", INTERNAL)).toBe(false); });
  it("true for external", () => { expect(isExternal("a@gmail.com", INTERNAL)).toBe(true); });
});
describe("classifyRecipients", () => {
  it("classifies mix", () => {
    const r = classifyRecipients([{email:"a@misfits.ai"},{email:"b@gmail.com"}], INTERNAL);
    expect(r[0].isExternal).toBe(false); expect(r[1].isExternal).toBe(true);
  });
});
describe("buildExternalWarning", () => {
  it("false for all internal", () => { expect(buildExternalWarning([{email:"a@misfits.ai"}], INTERNAL).hasExternal).toBe(false); });
  it("counts and dedupes", () => {
    const r = buildExternalWarning([{email:"a@gmail.com"},{email:"b@yahoo.com"}], INTERNAL);
    expect(r.externalCount).toBe(2); expect(r.domains).toEqual(["gmail.com","yahoo.com"]);
  });
});
describe("formatExternalWarning", () => {
  it("empty for none", () => { expect(formatExternalWarning(buildExternalWarning([], INTERNAL))).toBe(""); });
  it("singular", () => { expect(formatExternalWarning(buildExternalWarning([{email:"a@gmail.com"}], INTERNAL))).toBe("1 external recipient detected (gmail.com)."); });
  it("plural", () => { expect(formatExternalWarning(buildExternalWarning([{email:"a@gmail.com"},{email:"b@yahoo.com"}], INTERNAL))).toBe("2 external recipients detected (gmail.com, yahoo.com)."); });
});
