import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('trace login exact behavior', async ({ page }) => {
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  
  // Intercept the login API call
  await page.route('**/api/v1/auth/login', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    console.log('API Response status:', response.status());
    console.log('API Response body:', body.slice(0, 500));
    await route.continue();
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  
  // Before clicking, clear storage
  await page.evaluate(() => {
    localStorage.clear();
    console.log('Cleared localStorage');
  });
  
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  try {
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    console.log('Navigated to dashboard');
  } catch (e) {
    console.log('Did not navigate to dashboard:', e.message);
  }
  
  await page.waitForTimeout(2000);
  
  // Check exact localStorage contents
  const keys = await page.evaluate(() => Object.keys(localStorage));
  console.log('localStorage keys:', keys);
  
  for (const key of keys) {
    const value = localStorage.getItem(key);
    console.log(`${key}:`, JSON.stringify(value));
  }
  
  // Also check all possible values
  const all = await page.evaluate(() => {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      result[key] = localStorage.getItem(key);
    }
    return result;
  });
  console.log('All localStorage:', all);
});
