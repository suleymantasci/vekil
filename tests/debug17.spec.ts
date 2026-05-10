import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('wait for navigation to complete', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  
  // Try to wait for navigation
  try {
    await page.waitForURL('**/dashboard**', { timeout: 5000 });
    console.log('Navigated to dashboard!');
  } catch (e) {
    console.log('Did not navigate to dashboard:', e.message);
    // Check current URL
    console.log('Current URL:', page.url());
  }
  
  // Check localStorage anyway
  const token = await page.evaluate(() => localStorage.getItem('vekil_access_token'));
  const user = await page.evaluate(() => localStorage.getItem('vekil_user'));
  console.log('Token:', JSON.stringify(token));
  console.log('User:', JSON.stringify(user));
  
  // Check for errors
  console.log('Errors:', errors);
});
