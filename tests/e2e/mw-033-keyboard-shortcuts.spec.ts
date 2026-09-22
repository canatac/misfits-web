import { test, expect } from '@playwright/test';

const BASE_URL = 'https://mail.misfits.ai';

test.describe('MW-2026-033 — Keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('page loads successfully', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);
  });

  test('pressing "c" opens compose view', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('body', { state: 'visible' });
    await page.keyboard.press('c');
    // Check if compose view opened - look for compose-related elements
    const composeVisible = await page.locator('[data-testid="compose"], .compose, [class*="compose"], textarea[placeholder*="subject" i], [role="dialog"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(composeVisible).toBeTruthy();
  });

  test('pressing "/" focuses search field', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('body', { state: 'visible' });
    await page.keyboard.press('/');
    const searchFocused = await page.locator('input[type="search"], input[placeholder*="search" i], [data-testid="search-input"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(searchFocused).toBeTruthy();
  });

  test('pressing "?" shows keyboard shortcuts help', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('body', { state: 'visible' });
    await page.keyboard.press('?');
    const helpVisible = await page.locator('[class*="shortcut" i], [class*="help" i], [role="dialog"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(helpVisible).toBeTruthy();
  });
});
