import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('trace actual API URL called by login page', async ({ page }) => {
  page.on('request', req => {
    if (req.url().includes('api')) {
      console.log(`REQUEST: ${req.method()} ${req.url()}`);
    }
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Also check what NEXT_PUBLIC_API_URL evaluates to in browser
  const apiUrl = await page.evaluate(() => {
    return typeof process !== 'undefined' ? String(process.env.NEXT_PUBLIC_API_URL) : 'process undefined';
  });
  console.log('NEXT_PUBLIC_API_URL in browser:', apiUrl);
});
