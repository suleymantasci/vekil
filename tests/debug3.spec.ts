import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('debug body content', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('ERR:', msg.text());
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  // Get just body text
  const body = await page.locator('body').innerText();
  console.log('Body text (first 500 chars):', body.slice(0, 500));
  console.log('---');
  console.log('Body text (last 500 chars):', body.slice(-500));
  
  await page.screenshot({ path: '/tmp/dbgscreen3.png', fullPage: true });
});
