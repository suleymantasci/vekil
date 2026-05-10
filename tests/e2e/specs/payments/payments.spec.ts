import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

/**
 * Payments Module Tests
 * Tests payment recording functionality
 */
describe('Payments Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'Vekil2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.goto(`${BASE}/payments`);
    await page.waitForTimeout(1000);
  });

  test('TC-PAY-001: payments page loads successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/payments/);
  });

  test('TC-PAY-002: payments page shows content', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/Ödeme|Tahsilat/);
  });

  test('TC-PAY-003: add payment button exists', async ({ page }) => {
    const addButton = page.locator('button:has-text("Yeni")').first();
    await expect(addButton).toBeVisible();
  });
});
