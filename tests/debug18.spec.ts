import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('trace authApi.login response structure', async ({ page }) => {
  // Override the authApi.login method to capture what it returns
  await page.route('**/api/v1/auth/login', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    
    console.log('Raw response body:', body.slice(0, 300));
    
    await route.continue();
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Check localStorage
  const all = await page.evaluate(() => {
    const r = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      r[k] = localStorage.getItem(k);
    }
    return r;
  });
  console.log('localStorage:', JSON.stringify(all));
  
  // Check URL
  console.log('URL:', page.url());
});
