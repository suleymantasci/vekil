import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('trace exact values stored by login page', async ({ page }) => {
  let authApiLoginCalled = false;
  let loginResponseData = null;
  
  // Intercept at the network level to capture what the page actually receives
  await page.route('**/api/v1/auth/login', async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const parsed = JSON.parse(body);
    
    // This is EXACTLY what the API returns
    loginResponseData = parsed;
    
    // Let it continue to the page
    await route.continue();
  });
  
  // Capture all console output from the login page itself
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  
  console.log('\n=== API Response Data ===');
  console.log('data.user:', loginResponseData?.data?.user ? 'EXISTS' : 'MISSING');
  console.log('data.user.firstName:', loginResponseData?.data?.user?.firstName);
  console.log('data.organization:', loginResponseData?.data?.organization ? 'EXISTS' : 'MISSING');
  console.log('data.accessToken:', loginResponseData?.data?.accessToken ? 'EXISTS' : 'MISSING');
  
  // What would JSON.stringify produce?
  console.log('\n=== What would be stored ===');
  console.log('JSON.stringify(data.user):', JSON.stringify(loginResponseData?.data?.user));
  console.log('JSON.stringify(data.user ?? null):', JSON.stringify(loginResponseData?.data?.user ?? null));
  
  // Actual localStorage
  console.log('\n=== Actual localStorage ===');
  const all = await page.evaluate(() => {
    const r = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      r[k] = localStorage.getItem(k);
    }
    return r;
  });
  console.log(JSON.stringify(all, null, 2));
  
  // Check for error
  console.log('\n=== Console Logs ===');
  logs.forEach(l => console.log(l));
});
