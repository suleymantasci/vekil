import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('capture exact login response and what gets stored', async ({ page }) => {
  let loginResponseBody = '';
  
  await page.route('**/api/v1/auth/login', async (route) => {
    const response = await route.fetch();
    loginResponseBody = await response.text();
    await route.continue();
  });

  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  console.log('Raw login response:', loginResponseBody);
  
  // Try to parse what the login page SHOULD be seeing
  try {
    const parsed = JSON.parse(loginResponseBody);
    console.log('Parsed success:', parsed.success);
    console.log('data.user exists:', !!parsed.data?.user);
    console.log('data.organization exists:', !!parsed.data?.organization);
    console.log('data.accessToken exists:', !!parsed.data?.accessToken);
    console.log('data.refreshToken exists:', !!parsed.data?.refreshToken);
    
    // What would JSON.stringify(data.user) produce?
    console.log('JSON.stringify(data.user):', JSON.stringify(parsed.data?.user));
    console.log('JSON.stringify(data.organization):', JSON.stringify(parsed.data?.organization));
  } catch (e: any) {
    console.log('Parse error:', e.message);
  }
  
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
});
