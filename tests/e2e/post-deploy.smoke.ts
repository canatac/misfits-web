/**
 * Post-deploy checks of the interface on production (paperclip-fleet#878).
 *
 * Read-only, with the test account of the operator (QA_TEST_LOGIN,
 * QA_TEST_PASSWORD): nothing is sent, no account is added. Each check fails
 * on its own step, on an API call answered 5xx, or on an uncaught error of
 * the page. The title of each test names the check of the issue opened when
 * it fails (.github/scripts/post_deploy_report.py). Serial: a check that fails
 * stops the next ones, so the known bug of the catalogue comes last.
 */
import { expect, test, type Page } from "@playwright/test";

const LOGIN = process.env.QA_TEST_LOGIN ?? "";
const PASSWORD = process.env.QA_TEST_PASSWORD ?? "";

test.describe.configure({ mode: "serial" });

let page: Page;
const problems: string[] = [];

/** The API calls answered 5xx and the uncaught errors since the last check. */
function watch(target: Page): void {
  target.on("pageerror", (error) => problems.push(`uncaught error: ${error.name}: ${error.message.slice(0, 200)}`));
  target.on("response", (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith("/api/") && response.status() >= 500) {
      problems.push(`${response.request().method()} ${url.pathname} answered ${response.status()}`);
    }
  });
}

function noProblem(): void {
  const found = problems.splice(0);
  expect(found, found.join("; ")).toEqual([]);
}

test.beforeAll(async ({ browser }) => {
  test.skip(!LOGIN || !PASSWORD, "QA_TEST_LOGIN and QA_TEST_PASSWORD are not set");
  page = await browser.newPage();
  watch(page);
});

test.afterAll(async () => {
  await page?.close();
});

test("login", async () => {
  await page.goto("/login");
  await page.locator("#login-email").fill(LOGIN);
  await page.locator("#login-password").fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page, "the test account must have no 2FA").toHaveURL(/\/dashboard/, { timeout: 30_000 });
  noProblem();
});

test("mail", async () => {
  await page.goto("/mail");
  await expect(page.getByTestId("account-selector-trigger")).toBeVisible();
  await page.waitForLoadState("networkidle");
  noProblem();
});

test("compose", async () => {
  await page.goto("/compose");
  await page.waitForLoadState("networkidle");
  noProblem();
});

test("add account: provider catalogue", async () => {
  // reimagined-guide#784: "Provider catalogue request failed (HTTP 500)".
  await page.goto("/mail");
  await page.getByTestId("account-selector-trigger").click();
  const catalogue = page.waitForResponse((r) => r.url().includes("/api/external-accounts/oauth2/providers"));
  await page.getByTestId("add-account-menu-item").click();
  const status = (await catalogue).status();
  expect(status, `GET /api/external-accounts/oauth2/providers answered ${status}`).toBeLessThan(400);
  await expect(page.getByText(/Provider catalogue request failed/)).toHaveCount(0);
  await page.keyboard.press("Escape");
  noProblem();
});
