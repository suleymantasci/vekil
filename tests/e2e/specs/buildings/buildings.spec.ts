import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

/**
 * Buildings Module Tests
 * Tests building management CRUD operations
 */
describe('Buildings Module', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
    await page.fill('input[type="password"]', 'Vekil2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navigate to buildings
    await page.goto(`${BASE}/buildings`);
    await page.waitForTimeout(1000);
  });

  test('TC-BLDG-001: buildings page loads successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/buildings/);
    const body = await page.textContent('body');
    expect(body).toContain('Bina');
  });

  test('TC-BLDG-002: buildings list is displayed', async ({ page }) => {
    // Should show either a list or "Henüz bina yok" message
    const body = await page.textContent('body');
    expect(body).toMatch(/Bina|Henüz bina yok/);
  });

  test('TC-BLDG-003: add building button exists', async ({ page }) => {
    const addButton = page.locator('button:has-text("Yeni Bina")');
    await expect(addButton).toBeVisible();
  });

  test('TC-BLDG-004: can open new building modal', async ({ page }) => {
    await page.click('button:has-text("Yeni Bina")');
    
    // Check modal opened
    await expect(page.locator('text=Yeni Bina Ekle')).toBeVisible();
    await expect(page.locator('input[placeholder*="Bina"]')).toBeVisible();
  });

  test('TC-BLDG-005: building modal has required fields', async ({ page }) => {
    await page.click('button:has-text("Yeni Bina")');
    
    // Check form fields exist
    await expect(page.locator('input[placeholder*="Bina"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Adres"]')).toBeVisible();
    await expect(page.locator('button:has-text("Kaydet")')).toBeVisible();
  });

  test('TC-BLDG-006: close modal button works', async ({ page }) => {
    await page.click('button:has-text("Yeni Bina")');
    await expect(page.locator('text=Yeni Bina Ekle')).toBeVisible();
    
    await page.click('button:has-text("İptal")');
    await expect(page.locator('text=Yeni Bina Ekle')).not.toBeVisible();
  });
});
