import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('capture debug logs from login', async ({ page }) => {
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  
  console.log('=== ALL CONSOLE LOGS ===');
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
