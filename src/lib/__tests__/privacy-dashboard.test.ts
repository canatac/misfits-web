import { describe, it, expect } from "vitest";
import {
  buildPrivacyOverview,
  toggleConsent,
  getDeletableCategories,
  getRevocableServices,
  summarizeConsents,
  DEFAULT_RETENTION,
  DEFAULT_THIRD_PARTIES,
  DEFAULT_CONSENTS,
} from "@/lib/privacy-dashboard";

describe("buildPrivacyOverview", () => {
  it("returns defaults when no overrides", () => {
    const overview = buildPrivacyOverview();
    expect(overview.retention).toEqual(DEFAULT_RETENTION);
    expect(overview.thirdParties).toEqual(DEFAULT_THIRD_PARTIES);
    expect(overview.consents).toEqual(DEFAULT_CONSENTS);
    expect(overview.totalDataSize).toBeNull();
    expect(overview.lastAuditDate).toBeNull();
  });

  it("applies overrides", () => {
    const overview = buildPrivacyOverview({
      totalDataSize: 1024000,
      lastAuditDate: "2026-09-01T00:00:00Z",
    });
    expect(overview.totalDataSize).toBe(1024000);
    expect(overview.lastAuditDate).toBe("2026-09-01T00:00:00Z");
  });
});

describe("toggleConsent", () => {
  it("toggles non-required consent", () => {
    const result = toggleConsent(DEFAULT_CONSENTS, "analytics", false);
    const analytics = result.find((c) => c.id === "analytics");
    expect(analytics!.granted).toBe(false);
  });

  it("does not toggle required consent", () => {
    const result = toggleConsent(DEFAULT_CONSENTS, "core-service", false);
    const core = result.find((c) => c.id === "core-service");
    expect(core!.granted).toBe(true);
  });

  it("returns new array without mutating input", () => {
    const original = [...DEFAULT_CONSENTS];
    toggleConsent(DEFAULT_CONSENTS, "marketing", true);
    expect(DEFAULT_CONSENTS).toEqual(original);
  });

  it("handles unknown id gracefully", () => {
    const result = toggleConsent(DEFAULT_CONSENTS, "unknown", true);
    expect(result).toEqual(DEFAULT_CONSENTS);
  });
});

describe("getDeletableCategories", () => {
  it("filters to user-deletable only", () => {
    const overview = buildPrivacyOverview();
    const deletable = getDeletableCategories(overview);
    expect(deletable.every((d) => d.userDeletable)).toBe(true);
    expect(deletable.length).toBeGreaterThan(0);
  });
});

describe("getRevocableServices", () => {
  it("filters to revocable services only", () => {
    const overview = buildPrivacyOverview();
    const revocable = getRevocableServices(overview);
    expect(revocable.every((s) => s.revocable)).toBe(true);
  });
});

describe("summarizeConsents", () => {
  it("counts granted consents", () => {
    const result = summarizeConsents(DEFAULT_CONSENTS);
    const grantedCount = DEFAULT_CONSENTS.filter((c) => c.granted).length;
    expect(result.granted).toBe(grantedCount);
    expect(result.total).toBe(DEFAULT_CONSENTS.length);
  });

  it("counts required granted", () => {
    const result = summarizeConsents(DEFAULT_CONSENTS);
    expect(result.requiredGranted).toBe(DEFAULT_CONSENTS.filter((c) => c.required && c.granted).length);
  });
});
