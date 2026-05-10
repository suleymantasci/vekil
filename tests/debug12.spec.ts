import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('intercept and verify exact request/response on login', async ({ page }) => {
  let interceptedResponse = null;
  
  await page.route('**/api/v1/auth/login', async (route) => {
    const resp = await route.fetch();
    interceptedResponse = {
      status: resp.status(),
      body: await resp.text(),
    };
    await route.continue();
  });
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGEERROR] ${err.message}`));
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  
  const body = JSON.parse(interceptedResponse?.body || '{}');
  console.log('Response status:', interceptedResponse?.status);
  console.log('data.user exists:', !!body.data?.user);
  console.log('data.organization exists:', !!body.data?.organization);
  console.log('accessToken:', body.data?.accessToken ? 'present' : 'missing');
  
  console.log('\n=== CONSOLE LOGS ===');
  logs.forEach(l => console.log(l));
  
  console.log('\n=== localStorage ===');
  const all = await page.evaluate(() => {
    const r = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      r[k] = localStorage.getItem(k);
    }
    return r;
  });
  console.log(JSON.stringify(all));
});
