import { test, expect } from '@playwright/test';

const BASE_URL = 'https://mail.misfits.ai';

test.describe('MW-2026-035 — Auth bypass /api/emails exposed (P0 regression)', () => {
  test('production is reachable via HTTPS', async ({ request }) => {
    const response = await request.get(BASE_URL, { timeout: 10000, failOnStatusCode: false });
    // P0: production unreachable blocks all auth tests
    expect(response.status()).toBe(200);
  });

  test('/api/emails requires authentication (401)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/emails`, { timeout: 10000, failOnStatusCode: false });
    expect(response.status()).toBe(401);
  });

  test('/api/emails does not leak PII without auth', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/emails`, { timeout: 10000, failOnStatusCode: false });
    const body = await response.text().catch(() => '');
    expect(body).not.toContain('jan.atac');
    expect(body).not.toContain('@misfits.fr');
  });

  test('/api/hermes/runs requires authentication (401)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/hermes/runs`, { timeout: 10000, failOnStatusCode: false });
    expect(response.status()).toBe(401);
  });

  test('/api/admin/ai-activity requires authentication (401)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/ai-activity`, { timeout: 10000, failOnStatusCode: false });
    expect(response.status()).toBe(401);
  });

  test('/api/admin/users requires authentication (401)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/users`, { timeout: 10000, failOnStatusCode: false });
    expect(response.status()).toBe(401);
  });
});
