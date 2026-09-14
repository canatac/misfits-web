import { describe, it, expect } from 'vitest';
import {

} from '../newsletter-unsubscribe';
import { 
  generateUnsubscribeToken, 
  isTokenValid, 
  parseUnsubscribeToken, 
  buildUnsubscribeUrl, 
  processUnsubscribe, 
  bulkUnsubscribe, 
  formatUnsubscribeConfirmation, 
  UnsubscribeToken,
  parseUnsubscribeHeader,
  isUnsubscribeUrlSafe,
  getUnsubscribeLink,
} from "@/lib/newsletter-unsubscribe";


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

describe('newsletter-unsubscribe', () => {
  describe('parseUnsubscribeHeader', () => {
    it('parses mailto link', () => {
      const info = parseUnsubscribeHeader('<mailto:unsubscribe@example.com>');
      expect(info).not.toBeNull();
      expect(info?.isMailto).toBe(true);
      expect(info?.email).toBe('unsubscribe@example.com');
    });

    it('parses https link', () => {
      const info = parseUnsubscribeHeader('<https://example.com/unsubscribe>');
      expect(info).not.toBeNull();
      expect(info?.isMailto).toBe(false);
      expect(info?.url).toBe('https://example.com/unsubscribe');
    });

    it('detects one-click', () => {
      const info = parseUnsubscribeHeader('<mailto:unsubscribe@example.com>, List-Unsubscribe=One-Click');
      expect(info?.isOneClick).toBe(true);
    });

    it('returns null for empty header', () => {
      expect(parseUnsubscribeHeader('')).toBeNull();
    });
  });

  describe('isUnsubscribeUrlSafe', () => {
    it('accepts https', () => {
      expect(isUnsubscribeUrlSafe('https://example.com/unsubscribe')).toBe(true);
    });

    it('accepts mailto', () => {
      expect(isUnsubscribeUrlSafe('mailto:test@example.com')).toBe(true);
    });

    it('rejects javascript', () => {
      expect(isUnsubscribeUrlSafe('javascript:alert(1)')).toBe(false);
    });

    it('rejects invalid url', () => {
      expect(isUnsubscribeUrlSafe('not-a-url')).toBe(false);
    });
  });

  describe('getUnsubscribeLink', () => {
    it('extracts from headers', () => {
      const headers = { 'list-unsubscribe': '<https://example.com/unsub>' };
      expect(getUnsubscribeLink(headers)).toBe('https://example.com/unsub');
    });

    it('returns null when no header', () => {
      expect(getUnsubscribeLink({})).toBeNull();
    });
  });

});
