import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('inspect login response data structure', async ({ page }) => {
  let responseData = null;
  
  await page.route('**/api/v1/auth/login', async (route) => {
    const resp = await route.fetch();
    responseData = await resp.json();
    await route.continue();
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  console.log('Full response data:', JSON.stringify(responseData, null, 2));
  
  // Check current localStorage
  const all = await page.evaluate(() => {
    const r = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      r[k] = localStorage.getItem(k);
    }
    return r;
  });
  console.log('localStorage:', JSON.stringify(all));
  
  // Try to parse vekil_user and see what we get
  const userVal = all['vekil_user'];
  console.log('vekil_user raw:', userVal);
  if (userVal) {
    try {
      const parsed = JSON.parse(userVal);
      console.log('vekil_user parsed:', parsed);
    } catch (e: any) {
      console.log('vekil_user parse error:', e.message);
    }
  }
  
  await page.screenshot({ path: '/tmp/debug13.png' });
});
