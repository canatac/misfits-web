import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve(process.cwd(), "tests/integration/gherkin/artifacts/mx-001");
const outJson = path.join(outDir, "run-result.json");

function envFirst(...keys: string[]): string {
  for (const key of keys) {
    const val = process.env[key];
    if (val && val.trim().length > 0) return val.trim();
  }
  return "";
}

async function maybeLogin(page: import("@playwright/test").Page, result: Record<string, unknown>) {
  const email = envFirst("E2E_ADMIN_EMAIL", "ADMIN_EMAIL", "MISFITS_ADMIN_EMAIL");
  const password = envFirst("E2E_ADMIN_PASSWORD", "ADMIN_PASSWORD", "MISFITS_ADMIN_PASSWORD");

  const onLoginPage = /\/login(\?|$)/.test(new URL(page.url()).pathname + new URL(page.url()).search);
  if (!onLoginPage) {
    result["login_mode"] = "session-already-authenticated";
    return;
  }

  if (!email || !password) {
    result["login_mode"] = "missing-credentials";
    throw new Error("Login required but no admin credentials provided in env (E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD).");
  }

  const emailInput = page.locator('input#email, input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

  await expect(emailInput).toBeVisible({ timeout: 15000 });
  await emailInput.fill(email);
  await expect(passwordInput).toBeVisible({ timeout: 15000 });
  await passwordInput.fill(password);

  const submitBtn = page
    .locator('button[type="submit"], button:has-text("Se connecter"), button:has-text("Connexion"), button:has-text("Login")')
    .first();
  await expect(submitBtn).toBeVisible({ timeout: 10000 });
  await submitBtn.click();

  await page.waitForLoadState("networkidle", { timeout: 30000 });
  result["login_mode"] = "credentials-submitted";
}

test("MX-001 admin login + mailbox stable", async ({ page }) => {
  fs.mkdirSync(outDir, { recursive: true });

  const result: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    target: "https://mail.misfits.ai/mail",
    navigation: {},
    console_errors: [] as string[],
    request_failures: [] as Array<Record<string, string>>,
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") (result.console_errors as string[]).push(msg.text());
  });
  page.on("requestfailed", (req) => {
    (result.request_failures as Array<Record<string, string>>).push({
      url: req.url(),
      method: req.method(),
      error: req.failure()?.errorText ?? "unknown",
    });
  });

  const response = await page.goto("https://mail.misfits.ai/mail", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  result.navigation = {
    initial_status: response?.status() ?? null,
    final_url_after_first_nav: page.url(),
    title: await page.title(),
  };

  await page.screenshot({ path: path.join(outDir, "01-after-open.png"), fullPage: true });

  await maybeLogin(page, result);

  await page.goto("https://mail.misfits.ai/mail", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 30000 });
  await page.waitForTimeout(1500);

  const bodyText = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
  result["final_url"] = page.url();
  result["body_excerpt"] = bodyText.slice(0, 600);

  await page.screenshot({ path: path.join(outDir, "02-mailbox-final.png"), fullPage: true });

  expect(page.url()).not.toContain("/login");
  expect(bodyText).not.toMatch(/Internal Server Error/i);

  const hasMain = await page.locator("main, [role='main']").first().isVisible().catch(() => false);
  expect(hasMain).toBe(true);
  result["main_visible"] = hasMain;

  fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
});
