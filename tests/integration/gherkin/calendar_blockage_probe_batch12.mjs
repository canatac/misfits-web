import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const outDir = '/root/misfits-web/tests/integration/gherkin/artifacts/batch-12';
fs.mkdirSync(outDir, { recursive: true });

const report = {
  ts: new Date().toISOString(),
  targetUrl: 'http://localhost:3000/calendar',
  probes: {},
  selectors: {
    roleTextboxRechercherUnPays: 'getByRole(textbox,{name:Rechercher un pays})',
    anyTextboxRole: 'getByRole(textbox)',
    searchInput: 'input[type="search"]',
    placeholderPays: 'input[placeholder*="pays" i]',
    asideLabel: 'aside label'
  },
  consoleErrors: [],
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1680, height: 1050 } });
const page = await context.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') report.consoleErrors.push(msg.text());
});

await page.goto(report.targetUrl, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

report.finalUrl = page.url();
report.title = await page.title();
report.h1 = await page.locator('h1').first().textContent().catch(() => null);
report.bodyTextHead = (await page.locator('body').innerText().catch(() => '')).slice(0, 700);

const namedTextbox = page.getByRole('textbox', { name: 'Rechercher un pays' });
report.probes.roleTextboxRechercherUnPaysCount = await namedTextbox.count();
report.probes.roleTextboxRechercherUnPaysVisible = await namedTextbox.first().isVisible().catch(() => false);
report.probes.anyTextboxCount = await page.getByRole('textbox').count();
report.probes.searchInputCount = await page.locator('input[type="search"]').count();
report.probes.placeholderPaysCount = await page.locator('input[placeholder*="pays" i]').count();
report.probes.asideLabelCount = await page.locator('aside label').count();
report.probes.hasInternalServerErrorText = /Internal Server Error/i.test((await page.locator('body').innerText().catch(() => '')));

const screenshotPath = path.join(outDir, 'calendar-blockage-probe.png');
await page.screenshot({ path: screenshotPath, fullPage: true });
report.screenshot = screenshotPath;

const jsonPath = path.join(outDir, 'calendar-blockage-probe.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ jsonPath, report }, null, 2));

await browser.close();
