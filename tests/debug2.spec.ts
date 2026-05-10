import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('debug dashboard full', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(5000);
  
  console.log('Console errors:', errors.join('\n'));
  
  // Get HTML
  const html = await page.content();
  console.log('Has nextjs error:', html.includes('nextjs-error') || html.includes('Application error'));
  console.log('HTML length:', html.length);
  
  // Check localStorage
  const user = await page.evaluate(() => localStorage.getItem('vekil_user'));
  const token = await page.evaluate(() => localStorage.getItem('vekil_access_token'));
  console.log('User in localStorage:', user ? 'yes' : 'no');
  console.log('Token in localStorage:', token ? 'yes' : 'no');
  
  await page.screenshot({ path: '/tmp/dbgscreen2.png', fullPage: true });
  console.log('Screenshot done');
});
