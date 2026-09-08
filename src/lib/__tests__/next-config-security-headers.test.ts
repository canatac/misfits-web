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
});
