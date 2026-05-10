import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('detailed debug', async ({ page }) => {
  const networkReqs = [];
  page.on('request', req => {
    if (req.url().includes('api')) {
      networkReqs.push({ url: req.url(), method: req.method() });
    }
  });
  
  const responses = [];
  page.on('response', async res => {
    if (res.url().includes('api')) {
      try {
        const body = await res.text();
        responses.push({ url: res.url(), status: res.status(), body: body.slice(0, 200) });
      } catch {}
    }
  });
  
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(5000);
  
  console.log('\n=== API Requests ===');
  networkReqs.forEach(r => console.log(`${r.method} ${r.url}`));
  
  console.log('\n=== API Responses ===');
  responses.forEach(r => console.log(`${r.status} ${r.url}: ${r.body}`));
  
  await page.screenshot({ path: '/tmp/dbgscreen4.png', fullPage: true });
});
