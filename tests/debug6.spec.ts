import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('verify localStorage contents after login', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const user = await page.evaluate(() => localStorage.getItem('vekil_user'));
  const org = await page.evaluate(() => localStorage.getItem('vekil_org'));
  const token = await page.evaluate(() => localStorage.getItem('vekil_access_token'));
  
  console.log('user localStorage value:', user);
  console.log('org localStorage value:', org);
  console.log('token localStorage value:', token ? 'present' : 'missing');
  
  // Try to parse and see if it's valid JSON
  if (user) {
    try {
      JSON.parse(user);
      console.log('user is valid JSON');
    } catch (e: any) {
      console.log('user JSON parse error:', e.message);
    }
  }
  
  await page.screenshot({ path: '/tmp/debug6.png' });
});
