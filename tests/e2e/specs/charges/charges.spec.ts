import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

/**
 * Charges (Tahakkuk) Module Tests
 * Tests charge/dues management functionality
 */
describe('Charges Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'Vekil2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.goto(`${BASE}/charges`);
    await page.waitForTimeout(1000);
  });

  test('TC-CHRG-001: charges page loads successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/charges/);
  });

  test('TC-CHRG-002: charges page shows content', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/Tahakkuk|Aidat/);
  });

  test('TC-CHRG-003: add charge button exists if page has CRUD', async ({ page }) => {
    const addButton = page.locator('button:has-text("Yeni")').first();
    await expect(addButton).toBeVisible();
  });
});
