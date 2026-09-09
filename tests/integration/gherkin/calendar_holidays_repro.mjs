import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outDir = '/root/misfits-web/tests/integration/gherkin/artifacts/calendar-holidays';
fs.mkdirSync(outDir, { recursive: true });

const result = {
  timestamp: new Date().toISOString(),
  url: 'http://localhost:3000/calendar',
  targetDateIso: '2026-12-25',
  consoleErrors: [],
  requestFailures: [],
  apiTrace: [],
  search: {},
  importFlow: { selectedCountriesForImport: ['FR', 'US'] },
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1680, height: 1050 } });
const page = await context.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') result.consoleErrors.push(msg.text());
});
page.on('requestfailed', (req) => {
  result.requestFailures.push({
    url: req.url(),
    method: req.method(),
    failure: req.failure()?.errorText || 'unknown',
  });
});
page.on('response', async (res) => {
  const url = res.url();
  if (
    url.includes('date.nager.at') ||
    url.includes('raw.githubusercontent.com') ||
    url.includes('/api/calendar/events')
  ) {
    result.apiTrace.push({
      url,
      status: res.status(),
      ok: res.ok(),
      method: res.request().method(),
    });
  }
});

await page.goto(result.url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1800);
await page.screenshot({ path: path.join(outDir, '00-calendar-initial.png'), fullPage: true });

const searchInput = page.getByRole('textbox', { name: 'Rechercher un pays' });
result.importFlow.searchInputVisible = await searchInput.isVisible().catch(() => false);

if (!result.importFlow.searchInputVisible) {
  throw new Error('Holiday search input not visible in /calendar');
}

// A) Country search repro on exact required queries
for (const q of ['fr', 'France', 'noel']) {
  await searchInput.fill(q);
  await page.waitForTimeout(900);
  const emptyVisible = await page.getByText('Aucun pays trouvé').isVisible().catch(() => false);
  const rowLocator = page.locator('aside label');
  const rowCount = await rowLocator.count();
  const sample = [];
  for (let i = 0; i < Math.min(rowCount, 6); i += 1) {
    sample.push((await rowLocator.nth(i).innerText()).replace(/\s+/g, ' ').trim());
  }
  const shot = path.join(outDir, `01-search-${q}.png`);
  await page.screenshot({ path: shot, fullPage: true });
  result.search[q] = { rowCount, emptyVisible, sample, screenshotPath: shot };
}

result.searchSummary = {
  fr: result.search.fr?.rowCount ?? 0,
  France: result.search.France?.rowCount ?? 0,
  noel: result.search.noel?.rowCount ?? 0,
};

// Prepare FR + US selection for import case
await searchInput.fill('France');
await page.waitForTimeout(500);
const franceRow = page.locator('aside label', { hasText: 'France' }).first();
if (await franceRow.count()) {
  const franceCheckbox = franceRow.locator('button[role="checkbox"]');
  const state = await franceCheckbox.getAttribute('data-state');
  if (state !== 'checked') await franceCheckbox.click();
}

await searchInput.fill('US');
await page.waitForTimeout(600);
const usCandidates = page.locator('aside label');
const candidateCount = await usCandidates.count();
for (let i = 0; i < candidateCount; i += 1) {
  const txt = await usCandidates.nth(i).innerText();
  if (/\nUS\b|\bUS\b/.test(txt)) {
    const usCheckbox = usCandidates.nth(i).locator('button[role="checkbox"]');
    const state = await usCheckbox.getAttribute('data-state');
    if (state !== 'checked') await usCheckbox.click();
    result.importFlow.usRowText = txt.replace(/\s+/g, ' ').trim();
    break;
  }
}

await searchInput.fill('');
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(outDir, '02-fr-us-selected.png'), fullPage: true });

// B) Switch to month and move to Dec 2026
await page.getByRole('button', { name: 'Month' }).click();
await page.waitForTimeout(300);
for (let i = 0; i < 3; i += 1) {
  await page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).first().click();
  await page.waitForTimeout(180);
}
await page.screenshot({ path: path.join(outDir, '03-month-dec-2026.png'), fullPage: true });

const importButton = page.getByRole('button', { name: 'Importer les jours fériés' });
await importButton.click();
await page.waitForTimeout(3000);

const toasts = (await page.locator('[data-sonner-toast]').allTextContents())
  .map((t) => t.replace(/\s+/g, ' ').trim())
  .filter(Boolean);
result.importFlow.toasts = toasts;

const noelMatcher = /Noël \(FR\)|Noel \(FR\)|Christmas Day \(FR\)/i;
result.importFlow.noelVisibleInMonthView = await page.getByText(noelMatcher).first().isVisible().catch(() => false);
await page.screenshot({ path: path.join(outDir, '04-after-import-month.png'), fullPage: true });

await page.getByRole('button', { name: 'Day' }).click();
await page.waitForTimeout(600);
result.importFlow.noelVisibleInDayView = await page.getByText(noelMatcher).first().isVisible().catch(() => false);
await page.screenshot({ path: path.join(outDir, '05-day-view-check.png'), fullPage: true });

result.files = fs.readdirSync(outDir).map((f) => path.join(outDir, f)).sort();
const outJson = path.join(outDir, 'run-result.json');
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ outJson, search: result.search, importFlow: result.importFlow }, null, 2));

await browser.close();
