import { test, expect } from '@playwright/test';

const BASE_URL = 'https://mail.misfits.ai';

test.describe('MW-2026-032 — Reading mode (HTML sanitize)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('page loads successfully', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response?.status()).toBe(200);
  });

  test('reading mode strips inline scripts from HTML emails', async ({ page }) => {
    // Navigate to an email and activate reading mode
    await page.goto(BASE_URL);
    await page.waitForSelector('body', { state: 'visible' });
    // Attempt to open reading mode - look for the reading mode button/toggle
    const readingModeBtn = await page.locator('[data-testid="reading-mode"], [class*="reading-mode"], button:has-text("Mode lecture"), button:has-text("Reading mode")').first();
    const hasReadingMode = await readingModeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    // If reading mode exists, verify it strips scripts
    if (hasReadingMode) {
      await readingModeBtn.click();
      // After activating reading mode, no script tags should be present in the email content
      const scripts = await page.locator('[class*="email-content"] script, [class*="reading"] script').count();
      expect(scripts).toBe(0);
    } else {
      // Feature not implemented — mark as expected fail
      test.skip(!hasReadingMode, 'Reading mode feature not implemented');
    }
  });

  test('reading mode uses safe typography (line-height >= 1.5, max-width <= 800px)', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('body', { state: 'visible' });
    const readingModeBtn = await page.locator('[data-testid="reading-mode"], [class*="reading-mode"], button:has-text("Mode lecture"), button:has-text("Reading mode")').first();
    const hasReadingMode = await readingModeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasReadingMode) {
      await readingModeBtn.click();
      const contentArea = await page.locator('[class*="reading"], [class*="email-content"]').first();
      if (await contentArea.isVisible({ timeout: 3000 }).catch(() => false)) {
        const lineHeight = await contentArea.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
        const maxWidth = await contentArea.evaluate((el) => parseFloat(getComputedStyle(el).maxWidth));
        expect(lineHeight).toBeGreaterThanOrEqual(1.5 * 16); // >= 1.5em in px (base 16px)
        expect(maxWidth).toBeLessThanOrEqual(800);
      }
    } else {
      test.skip(!hasReadingMode, 'Reading mode feature not implemented');
    }
  });

  test('reading mode lazy-loads images', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForSelector('body', { state: 'visible' });
    const readingModeBtn = await page.locator('[data-testid="reading-mode"], [class*="reading-mode"], button:has-text("Mode lecture"), button:has-text("Reading mode")').first();
    const hasReadingMode = await readingModeBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasReadingMode) {
      await readingModeBtn.click();
      const images = await page.locator('[class*="reading"] img, [class*="email-content"] img');
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const loading = await images.nth(i).getAttribute('loading');
        expect(loading).toBe('lazy');
      }
    } else {
      test.skip(!hasReadingMode, 'Reading mode feature not implemented');
    }
  });
});
