/**
 * Post-deploy checks of the interface on production (paperclip-fleet#878).
 *
 * Run by the job post-deploy-smoke of .github/workflows/cicd.yml once the
 * deploy succeeded: pnpm exec playwright test -c tests/e2e/playwright.config.ts
 * Only the files *.smoke.ts: never picked up by vitest.
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.smoke.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 1,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "results/post-deploy.json" }]],
  outputDir: "results/artifacts",
  use: {
    baseURL: process.env.QA_BASE_URL,
    // No screenshot: the repository is public, the mailbox of the test account is not.
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
