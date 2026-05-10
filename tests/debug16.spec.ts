import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('verify login behavior step by step', async ({ page }) => {
  const errors = [];
  const logs = [];
  
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  page.on('pageerror', err => errors.push(`PAGEERROR: ${err.message}`));
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  
  // Wait a short time and check what happened
  await page.waitForTimeout(2000);
  
  console.log('URL after 2s:', page.url());
  console.log('Errors:', errors);
  console.log('Logs:', logs.slice(0, 10));
  
  // Check localStorage values
  const token = await page.evaluate(() => localStorage.getItem('vekil_access_token'));
  console.log('Token value:', JSON.stringify(token));
  console.log('Token is falsy:', !token);
});
