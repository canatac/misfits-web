import { describe, it, expect } from "vitest";
import { buildWelcomeEmail, buildTipsEmail, buildFeedbackEmail, buildOnboardingSequence, scheduleDate, emailsDueBy, UserContext } from "@/lib/onboarding-email";
const ctx: UserContext = { name: "Alice", email: "alice@misfits.ai", plan: "pro", signupDate: new Date("2026-09-01") };
describe("buildWelcomeEmail", () => {
  it("returns day 0", () => { const e = buildWelcomeEmail(ctx); expect(e.day).toBe(0); expect(e.subject).toContain("Alice"); });
});
describe("buildTipsEmail", () => { it("returns day 2", () => { expect(buildTipsEmail(ctx).day).toBe(2); }); });
describe("buildFeedbackEmail", () => { it("returns day 7", () => { expect(buildFeedbackEmail(ctx).day).toBe(7); }); });
describe("buildOnboardingSequence", () => { it("returns 3 emails", () => { expect(buildOnboardingSequence(ctx)).toHaveLength(3); }); });
describe("scheduleDate", () => { it("adds days", () => { expect(scheduleDate(new Date("2026-09-01"), 2).getDate()).toBe(3); }); });
describe("emailsDueBy", () => {
  it("returns due emails", () => { const seq = buildOnboardingSequence(ctx); expect(emailsDueBy(new Date("2026-09-01"), new Date("2026-09-06"), seq).map(e=>e.day)).toEqual([0,2]); });
  it("returns all after 7d", () => { const seq = buildOnboardingSequence(ctx); expect(emailsDueBy(new Date("2026-09-01"), new Date("2026-09-10"), seq).map(e=>e.day)).toEqual([0,2,7]); });
});
