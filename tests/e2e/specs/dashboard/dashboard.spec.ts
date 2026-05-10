import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

/**
 * Dashboard Module Tests
 * Tests the main dashboard page functionality
 */
describe('Dashboard Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'Vekil2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('TC-DASH-001: dashboard loads successfully after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    const body = await page.textContent('body');
    expect(body).toContain('Hoş Geldiniz');
  });

  test('TC-DASH-002: welcome banner is displayed', async ({ page }) => {
    const welcomeBanner = page.locator('text=Hoş Geldiniz');
    await expect(welcomeBanner).toBeVisible();
  });

  test('TC-DASH-003: finance overview cards are displayed', async ({ page }) => {
    const financeSection = page.locator('text=Finans Özeti');
    await expect(financeSection).toBeVisible();
    
    // Check finance cards exist
    await expect(page.locator('text=Bu Ay Tahakkuk')).toBeVisible();
    await expect(page.locator('text=Tahsil Edilen')).toBeVisible();
    await expect(page.locator('text=Kalan Borç')).toBeVisible();
  });

  test('TC-DASH-004: stats overview cards are displayed', async ({ page }) => {
    const overviewSection = page.locator('text=Genel Bakış');
    await expect(overviewSection).toBeVisible();
    
    // Check stat cards
    await expect(page.locator('text=Binalar')).toBeVisible();
    await expect(page.locator('text=Daireler')).toBeVisible();
    await expect(page.locator('text=Kullanıcılar')).toBeVisible();
    await expect(page.locator('text=Açık İş Emirleri')).toBeVisible();
  });

  test('TC-DASH-005: quick actions section is displayed', async ({ page }) => {
    const quickActions = page.locator('text=Hızlı İşlemler');
    await expect(quickActions).toBeVisible();
    
    // Check action links
    await expect(page.locator('text=Aidat Kuralları')).toBeVisible();
    await expect(page.locator('text=Yeni Bina Ekle')).toBeVisible();
  });

  test('TC-DASH-006: system status section shows active services', async ({ page }) => {
    const systemStatus = page.locator('text=Sistem Durumu');
    await expect(systemStatus).toBeVisible();
    
    await expect(page.locator('text=Veritabanı Bağlantısı')).toBeVisible();
    await expect(page.locator('text=API Servisi')).toBeVisible();
  });

  test('TC-DASH-007: no console errors on dashboard load', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));
    
    await page.goto(`${BASE}/dashboard`);
    await page.waitForTimeout(2000);
    
    expect(errors.length).toBe(0);
  });

  test('TC-DASH-008: buildings link navigates to buildings page', async ({ page }) => {
    await page.click('text=Binalar');
    await expect(page).toHaveURL(/\/buildings/);
  });

  test('TC-DASH-009: users link navigates to users page', async ({ page }) => {
    await page.click('text=Kullanıcılar');
    await expect(page).toHaveURL(/\/users/);
  });

  test('TC-DASH-010: finance card links to charges page', async ({ page }) => {
    await page.click('text=Bu Ay Tahakkuk');
    await expect(page).toHaveURL(/\/charges/);
  });
});
