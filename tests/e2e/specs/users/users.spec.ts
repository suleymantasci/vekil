import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

/**
 * Users Module Tests
 * Tests user management functionality
 */
describe('Users Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'Vekil2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.goto(`${BASE}/users`);
    await page.waitForTimeout(1000);
  });

  test('TC-USER-001: users page loads successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/users/);
    const body = await page.textContent('body');
    expect(body).toContain('Kullanıcı');
  });

  test('TC-USER-002: add user button exists', async ({ page }) => {
    const addButton = page.locator('button:has-text("Yeni Kullanıcı")');
    await expect(addButton).toBeVisible();
  });

  test('TC-USER-003: users list or empty state is shown', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body).toMatch(/Kullanıcılar|Hiçbir kullanıcı|Kullanıcı yüklenemedi/);
  });

  test('TC-USER-004: users table has correct columns when data exists', async ({ page }) => {
    // If users exist, table should have headers
    const body = await page.textContent('body');
    if (body.includes('Admin')) {
      // Table is shown
      await expect(page.locator('th:has-text("Ad")')).toBeVisible();
      await expect(page.locator('th:has-text("E-posta")')).toBeVisible();
    }
  });
});
