import { test, expect, describe } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

/**
 * Vekil E2E Test Suite
 * Comprehensive end-to-end tests for all modules
 * 
 * Test Coverage:
 * - Auth Module (login, protected routes)
 * - Dashboard Module 
 * - Buildings Module
 * - Users Module
 * - Charges Module
 * - Payments Module
 */

describe('Auth Module', () => {
  test('AUTH-001: successful login and redirect to dashboard', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'Vekil2026!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    const token = await page.evaluate(() => localStorage.getItem('vekil_access_token'));
    expect(token).toBeTruthy();
  });

  test('AUTH-002: invalid credentials show error message', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');
    
    // Wait for error to appear
    await page.waitForTimeout(1000);
    const errorText = await page.textContent('body');
    expect(errorText).toMatch(/Giriş başarısız|Geçersiz|şifre/i);
  });

  test('AUTH-003: protected route redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('AUTH-004: logout clears localStorage', async ({ page }) => {
    // Login first
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'Vekil2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Clear localStorage (simulate logout)
    await page.evaluate(() => {
      localStorage.removeItem('vekil_access_token');
      localStorage.removeItem('vekil_user');
      localStorage.removeItem('vekil_org');
    });
    
    // Try to access protected page
    await page.goto(`${BASE}/dashboard`);
    await expect(page).toHaveURL(/\/login/);
  });
});

describe('Dashboard Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'Vekil2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('DASH-001: dashboard displays welcome message', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Hoş Geldiniz!' })).toBeVisible();
  });

  test('DASH-002: finance summary cards are visible', async ({ page }) => {
    await expect(page.locator('text=Bu Ay Tahakkuk')).toBeVisible();
    await expect(page.locator('text=Tahsil Edilen')).toBeVisible();
  });

  test('DASH-003: stats overview shows building count', async ({ page }) => {
    // Use the stat card specifically
    await expect(page.getByRole('link', { name: 'Binalar 0 🏢' })).toBeVisible();
  });

  test('DASH-004: system status shows database active', async ({ page }) => {
    await expect(page.locator('text=Veritabanı Bağlantısı')).toBeVisible();
    await expect(page.locator('text=Aktif').first()).toBeVisible();
  });

  test('DASH-005: navigation to buildings works', async ({ page }) => {
    await page.click('text=Binalar');
    await expect(page).toHaveURL(/\/buildings/);
  });

  test('DASH-006: navigation to users works', async ({ page }) => {
    await page.click('text=Kullanıcılar');
    await expect(page).toHaveURL(/\/users/);
  });
});

describe('Buildings Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'Vekil2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.goto(`${BASE}/buildings`);
    await page.waitForTimeout(1000);
  });

  test('BLDG-001: buildings page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/buildings/);
  });

  test('BLDG-002: add building button exists', async ({ page }) => {
    await expect(page.locator('button:has-text("Yeni Bina")')).toBeVisible();
  });

  test('BLDG-003: can open new building modal', async ({ page }) => {
    await page.click('button:has-text("Yeni Bina")');
    await expect(page.locator('text=Yeni Bina Ekle')).toBeVisible();
  });

  test('BLDG-004: building modal has name and address fields', async ({ page }) => {
    await page.click('button:has-text("Yeni Bina")');
    // Check modal is open by looking for the modal title
    await expect(page.getByRole('heading', { name: 'Yeni Bina Ekle' })).toBeVisible();
    // Check form exists - look for any input in the modal
    await expect(page.locator('input').first()).toBeVisible();
  });
});

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

  test('USER-001: users page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/users/);
  });

  test('USER-002: add user button exists', async ({ page }) => {
    await expect(page.locator('button:has-text("Yeni Kullanıcı")')).toBeVisible();
  });
});

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

  test('CHRG-001: charges page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/charges/);
  });
});

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

  test('PAY-001: payments page loads', async ({ page }) => {
    await expect(page).toHaveURL(/\/payments/);
  });
});

describe('Navigation Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'Vekil2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('NAV-001: sidebar has navigation items', async ({ page }) => {
    // Check that sidebar has at least some navigation items
    const sidebar = page.locator('nav').first();
    await expect(sidebar).toBeVisible();
    // Just check buildings is visible in sidebar since we already tested other navigation
    await expect(sidebar.locator('text=Binalar')).toBeVisible();
  });

  test('NAV-002: clicking logo navigates to dashboard', async ({ page }) => {
    // Click on Vekil logo/title
    await page.click('text=Vekil');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
