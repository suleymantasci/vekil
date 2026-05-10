import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

/**
 * Auth Module - Login Tests
 * Tests the login flow including:
 * - Successful login with valid credentials
 * - Failed login with invalid credentials
 * - Protected route redirect when not authenticated
 * - Token storage in localStorage
 */
describe('Auth Module - Login', () => {
  test('TC-AUTH-001: successful login with valid credentials', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'Vekil2026!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify token stored
    const token = await page.evaluate(() => localStorage.getItem('vekil_access_token'));
    expect(token).toBeTruthy();
    
    // Verify user stored
    const userStr = await page.evaluate(() => localStorage.getItem('vekil_user'));
    expect(userStr).toBeTruthy();
    const user = JSON.parse(userStr);
    expect(user.email).toBe('admin@vekil.tasci.cloud');
  });

  test('TC-AUTH-002: failed login with wrong password shows error', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Should show error message
    const errorEl = page.locator('.bg-red-50');
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });

  test('TC-AUTH-003: failed login with non-existent email shows error', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'nonexistent@test.com');
    await page.fill('input[type="password"]', 'AnyPassword123!');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/login/);
    const errorEl = page.locator('.bg-red-50');
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });

  test('TC-AUTH-004: protected route redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-AUTH-005: login page has correct form fields', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    
    // Check email input exists
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Check password input exists
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Check submit button exists
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText('Giriş Yap');
  });

  test('TC-AUTH-006: register link exists on login page', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const registerLink = page.locator('a[href="/register"]');
    await expect(registerLink).toBeVisible();
  });
});
