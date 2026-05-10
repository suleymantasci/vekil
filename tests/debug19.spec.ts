import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

// NO interception - just plain login
test('plain login test', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  
  // Wait for any navigation
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  
  const all = await page.evaluate(() => {
    const r = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      r[k] = localStorage.getItem(k);
    }
    return r;
  });
  console.log('localStorage:', JSON.stringify(all, null, 2));
  
  // Check page screenshot
  const screenshot = await page.screenshot({ path: '/tmp/debug19.png' });
  console.log('Screenshot saved');
});
