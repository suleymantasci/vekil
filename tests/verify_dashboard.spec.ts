import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('verify dashboard loads without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  // Check the page loaded properly
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for key elements
  const body = await page.textContent('body');
  console.log('Has welcome text:', body?.includes('Hoş Geldiniz'));
  console.log('Has finance section:', body?.includes('Finans'));
  
  console.log('Errors found:', errors.length);
  errors.forEach(e => console.log('  -', e));
  
  // If no errors, test passes
  expect(errors.length).toBe(0);
});
