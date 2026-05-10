import { test, expect } from '@playwright/test';

const BASE = 'https://vekil.tasci.cloud';

test('full localStorage dump after login', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  await page.fill('input[type="password"]', 'Vekil2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  const all = await page.evaluate(() => {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      result[key] = localStorage.getItem(key);
    }
    return result;
  });
  
  console.log('All localStorage:');
  Object.entries(all).forEach(([k, v]) => {
    console.log(`  ${k}: ${String(v).slice(0, 100)}`);
  });
  
  // Try to parse each value
  Object.entries(all).forEach(([k, v]) => {
    if (v === 'undefined') {
      console.log(`  ${k} === STRING "undefined" !!!`);
    }
    try {
      JSON.parse(v);
      console.log(`  ${k}: valid JSON`);
    } catch (e: any) {
      console.log(`  ${k}: INVALID JSON - ${e.message}`);
    }
  });
});
