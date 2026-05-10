import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('trace 404 URL', async ({ page }) => {
  const errors = [];
  const logs = [];
  
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(`PAGEERROR: ${err.message}`));
  
  // Track 404 responses
  page.on('response', async response => {
    if (response.status() === 404) {
      console.log(`404: ${response.url()}`);
    }
  });
  
  // Track failed requests
  page.on('requestfailed', request => {
    console.log(`FAILED: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  console.log('\n=== ERRORS ===');
  errors.forEach(e => console.log(e));
  
  console.log('\n=== ALL CONSOLE LOGS ===');
  logs.forEach(l => console.log(l));
});
