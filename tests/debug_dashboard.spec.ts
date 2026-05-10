import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('debug dashboard crash', async ({ page }) => {
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGEERROR] ${err.message}`));
  
  // Login first
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  console.log('=== PAGE ERRORS ===');
  logs.filter(l => l.startsWith('[PAGEERROR]')).forEach(l => console.log(l));
  
  console.log('\n=== ALL CONSOLE LOGS ===');
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
  
  // Check the page HTML
  const body = await page.textContent('body');
  console.log('\n=== BODY TEXT ===');
  console.log(body?.slice(0, 500));
  
  await page.screenshot({ path: '/tmp/dashboard_crash.png', fullPage: true });
});
