import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

// Simple test - no interception, just check final state
test('verify login stores correct values', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  const all = await page.evaluate(() => {
    const r = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      r[k] = localStorage.getItem(k);
    }
    return r;
  });
  
  console.log('localStorage:', JSON.stringify(all, null, 2));
  
  // Check if we're actually on the dashboard
  const url = page.url();
  console.log('Current URL:', url);
  
  // Check page content
  const bodyText = await page.textContent('body');
  console.log('Body preview:', bodyText?.slice(0, 200));
});
