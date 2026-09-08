import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";

describe("next config security headers", () => {
  it("defines Permissions-Policy for all routes", async () => {
    const headerRules = await nextConfig.headers?.();
    const globalRule = headerRules?.find((rule) => rule.source === "/(.*)");
    const permissionsPolicy = globalRule?.headers.find(
      (header) => header.key.toLowerCase() === "permissions-policy"
    );

    expect(permissionsPolicy?.value).toContain("camera=()");
    expect(permissionsPolicy?.value).toContain("microphone=()");
  });

  it("defines Cross-Origin-Opener-Policy for all routes", async () => {
    const headerRules = await nextConfig.headers?.();
    const globalRule = headerRules?.find((rule) => rule.source === "/(.*)");
    const coop = globalRule?.headers.find(
      (header) => header.key.toLowerCase() === "cross-origin-opener-policy"
    );

    expect(coop?.value).toBe("same-origin");
  });

  it("defines Cross-Origin-Opener-Policy explicitly on home route", async () => {
    const headerRules = await nextConfig.headers?.();
    const homeRule = headerRules?.find((rule) => rule.source === "/");
    const coop = homeRule?.headers.find(
      (header) => header.key.toLowerCase() === "cross-origin-opener-policy"
    );

    expect(coop?.value).toBe("same-origin");
  });
});
