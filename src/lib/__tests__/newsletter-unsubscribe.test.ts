import { describe, it, expect } from "vitest";
import { generateUnsubscribeToken, isTokenValid, parseUnsubscribeToken, buildUnsubscribeUrl, processUnsubscribe, bulkUnsubscribe, formatUnsubscribeConfirmation, UnsubscribeToken } from "@/lib/newsletter-unsubscribe";
describe("generateUnsubscribeToken", () => {
  it("creates with expiry", () => { const t = generateUnsubscribeToken("a@b.com", "nl", 86400000); expect(t.email).toBe("a@b.com"); expect(t.newsletterId).toBe("nl"); expect(t.expiresAt).toBeGreaterThan(Date.now()); });
  it("default TTL", () => { const t = generateUnsubscribeToken("a@b.com", "nl"); expect(t.expiresAt).toBeGreaterThan(Date.now()); });
});
describe("isTokenValid", () => {
  it("valid for fresh", () => { expect(isTokenValid(generateUnsubscribeToken("a@b.com", "nl", 86400000))).toBe(true); });
  it("invalid for expired", () => { expect(isTokenValid({email:"a@b.com",newsletterId:"nl",signature:"x",expiresAt:Date.now()-1000})).toBe(false); });
});
describe("parseUnsubscribeToken", () => {
  it("round-trips", () => { const o = generateUnsubscribeToken("a@b.com", "nl", 86400000); const p = parseUnsubscribeToken(encodeURIComponent(JSON.stringify(o))); expect(p).toEqual(o); });
  it("null for invalid JSON", () => { expect(parseUnsubscribeToken("bad")).toBeNull(); });
  it("null for missing fields", () => { expect(parseUnsubscribeToken(encodeURIComponent(JSON.stringify({email:"a@b.com"})))).toBeNull(); });
});
describe("buildUnsubscribeUrl", () => {
  it("builds URL", () => { const t = generateUnsubscribeToken("a@b.com", "nl", 86400000); expect(buildUnsubscribeUrl("https://app.com", t)).toContain("/unsubscribe?token="); });
});
describe("processUnsubscribe", () => {
  it("succeeds with valid", () => { const r = processUnsubscribe(generateUnsubscribeToken("a@b.com", "nl", 86400000), true); expect(r.success).toBe(true); expect(r.preferencesRetained).toBe(true); });
  it("fails expired", () => { const r = processUnsubscribe({email:"a@b.com",newsletterId:"nl",signature:"x",expiresAt:Date.now()-1000}); expect(r.success).toBe(false); expect(r.preferencesRetained).toBe(false); });
});
describe("bulkUnsubscribe", () => {
  it("all succeed", () => { const r = bulkUnsubscribe([generateUnsubscribeToken("a@b.com","nl1"),generateUnsubscribeToken("a@b.com","nl2")]); expect(r.total).toBe(2); expect(r.succeeded).toBe(2); });
  it("mixed", () => { const r = bulkUnsubscribe([generateUnsubscribeToken("a@b.com","ok"),{email:"a@b.com",newsletterId:"exp",signature:"x",expiresAt:Date.now()-1000}]); expect(r.succeeded).toBe(1); expect(r.failed).toBe(1); });
});
describe("formatUnsubscribeConfirmation", () => {
  it("success", () => { expect(formatUnsubscribeConfirmation({success:true,newsletterId:"nl",preferencesRetained:true})).toBe("Successfully unsubscribed from nl."); });
  it("fail", () => { expect(formatUnsubscribeConfirmation({success:false,newsletterId:"nl",preferencesRetained:false})).toContain("Failed to unsubscribe"); });
});
