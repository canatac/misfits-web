import { describe, it, expect } from "vitest";
import { scanForPhishing } from "../phishing-scanner";

describe("scanForPhishing", () => {
  it("returns safe for trusted domain with clean body", () => {
    const result = scanForPhishing({ from: { name: "Google", address: "no-reply@gmail.com" }, body: "Hello, your meeting is tomorrow.", bodyType: "text" });
    expect(result.threatLevel).toBe("safe");
    expect(result.indicators.length).toBe(0);
  });

  it("flags suspicious TLD", () => {
    const result = scanForPhishing({ from: { name: "Scam", address: "evil@pay.xyz" }, body: "Click here", bodyType: "text" });
    expect(result.indicators.some((i) => i.type === "domain")).toBe(true);
  });

  it("flags typosquatting", () => {
    const result = scanForPhishing({ from: { name: "PayPal", address: "verify@paypa1.com" }, body: "Confirm your account", bodyType: "text" });
    expect(result.indicators.some((i) => i.detail.includes("typosquatting"))).toBe(true);
    expect(result.threatLevel).toBe("high");
  });

  it("flags dangerous attachments", () => {
    const result = scanForPhishing({ from: { name: "IT", address: "it@company.com" }, body: "See attached", bodyType: "text", attachments: [{ filename: "invoice.exe" }] });
    expect(result.indicators.some((i) => i.type === "attachment")).toBe(true);
  });

  it("flags suspicious URLs in body", () => {
    const result = scanForPhishing({ from: { name: "News", address: "news@legit.com" }, body: "Visit https://g00gle.com/verify now", bodyType: "text" });
    expect(result.indicators.some((i) => i.type === "url" || i.type === "domain")).toBe(true);
  });

  it("respects sensitivity level", () => {
    const lowSens = scanForPhishing({ from: { name: "Test", address: "t@example.xyz" }, body: "Hi", bodyType: "text", sensitivity: "low" });
    const highSens = scanForPhishing({ from: { name: "Test", address: "t@example.xyz" }, body: "Hi", bodyType: "text", sensitivity: "high" });
    expect(highSens.score).toBeGreaterThanOrEqual(lowSens.score);
  });
});
