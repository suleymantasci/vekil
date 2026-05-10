# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/e2e.spec.ts >> Vekil Application - Full Test Suite >> STAGE 10: API Health & Auth Functions >> 10.2 - Auth refresh token works
- Location: tests/e2e.spec.ts:397:9

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 429
Received array: [200, 401]
```

# Test source

```ts
  312 |       expect([200, 404]).toContain(response.status());
  313 |     });
  314 |   });
  315 | 
  316 |   // ============================================================
  317 |   // STAGE 8: Documents Module
  318 |   // ============================================================
  319 |   test.describe('STAGE 8: Documents', () => {
  320 |     test.beforeEach(async ({ page }) => {
  321 |       await page.goto(`${BASE_URL}/login`);
  322 |       await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  323 |       await page.fill('input[type="password"]', 'Vekil2026!');
  324 |       await page.click('button[type="submit"]');
  325 |       await page.waitForURL('**/dashboard', { timeout: 10000 });
  326 |       authToken = await page.evaluate(() => localStorage.getItem('vekil_access_token') || '');
  327 |       orgId = await page.evaluate(() => {
  328 |         const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
  329 |         return org.id || '';
  330 |       });
  331 |     });
  332 | 
  333 |     test('8.1 - Documents page loads', async ({ page }) => {
  334 |       await page.goto(`${BASE_URL}/documents`);
  335 |       await page.waitForTimeout(3000);
  336 |       expect(page.url()).toContain('/documents');
  337 |     });
  338 | 
  339 |     test('8.2 - Documents API returns data', async ({ page }) => {
  340 |       const response = await page.request.get(
  341 |         `${process.env.NEXT_PUBLIC_API_URL}/documents?organizationId=${orgId}`,
  342 |         { headers: { Authorization: `Bearer ${authToken}` } }
  343 |       );
  344 |       expect([200, 404]).toContain(response.status());
  345 |     });
  346 |   });
  347 | 
  348 |   // ============================================================
  349 |   // STAGE 9: Work Orders Module
  350 |   // ============================================================
  351 |   test.describe('STAGE 9: Work Orders', () => {
  352 |     test.beforeEach(async ({ page }) => {
  353 |       await page.goto(`${BASE_URL}/login`);
  354 |       await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  355 |       await page.fill('input[type="password"]', 'Vekil2026!');
  356 |       await page.click('button[type="submit"]');
  357 |       await page.waitForURL('**/dashboard', { timeout: 10000 });
  358 |       authToken = await page.evaluate(() => localStorage.getItem('vekil_access_token') || '');
  359 |       orgId = await page.evaluate(() => {
  360 |         const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
  361 |         return org.id || '';
  362 |       });
  363 |     });
  364 | 
  365 |     test('9.1 - Work Orders page loads', async ({ page }) => {
  366 |       await page.goto(`${BASE_URL}/work-orders`);
  367 |       await page.waitForTimeout(3000);
  368 |       expect(page.url()).toContain('/work-orders');
  369 |     });
  370 | 
  371 |     test('9.2 - Work Orders API returns data', async ({ page }) => {
  372 |       const response = await page.request.get(
  373 |         `${process.env.NEXT_PUBLIC_API_URL}/work-orders?organizationId=${orgId}`,
  374 |         { headers: { Authorization: `Bearer ${authToken}` } }
  375 |       );
  376 |       expect([200, 404]).toContain(response.status());
  377 |     });
  378 |   });
  379 | 
  380 |   // ============================================================
  381 |   // STAGE 10: API Health Check
  382 |   // ============================================================
  383 |   test.describe('STAGE 10: API Health & Auth Functions', () => {
  384 |     test('10.1 - Auth login endpoint works', async ({ request }) => {
  385 |       const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
  386 |         data: {
  387 |           email: 'admin@vekil.tasci.cloud',
  388 |           password: 'Vekil2026!'
  389 |         }
  390 |       });
  391 |       expect(response.status()).toBe(200);
  392 |       const data = await response.json();
  393 |       expect(data.success).toBe(true);
  394 |       expect(data.data).toHaveProperty('accessToken');
  395 |     });
  396 | 
  397 |     test('10.2 - Auth refresh token works', async ({ request }) => {
  398 |       // First login
  399 |       const loginRes = await request.post(`${BASE_URL}/api/v1/auth/login`, {
  400 |         data: {
  401 |           email: 'admin@vekil.tasci.cloud',
  402 |           password: 'Vekil2026!'
  403 |         }
  404 |       });
  405 |       const loginData = await loginRes.json();
  406 |       const refreshToken = loginData.data.refreshToken;
  407 |       
  408 |       // Refresh
  409 |       const refreshRes = await request.post(`${BASE_URL}/api/v1/auth/refresh`, {
  410 |         data: { refreshToken }
  411 |       });
> 412 |       expect([200, 401]).toContain(refreshRes.status());
      |                          ^ Error: expect(received).toContain(expected) // indexOf
  413 |     });
  414 | 
  415 |     test('10.3 - Invalid login returns 401', async ({ request }) => {
  416 |       const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
  417 |         data: {
  418 |           email: 'admin@vekil.tasci.cloud',
  419 |           password: 'WrongPassword!'
  420 |         }
  421 |       });
  422 |       expect(response.status()).toBe(401);
  423 |     });
  424 | 
  425 |     test('10.4 - Auth Me endpoint works with token', async ({ request }) => {
  426 |       // Login first
  427 |       const loginRes = await request.post(`${BASE_URL}/api/v1/auth/login`, {
  428 |         data: {
  429 |           email: 'admin@vekil.tasci.cloud',
  430 |           password: 'Vekil2026!'
  431 |         }
  432 |       });
  433 |       const loginData = await loginRes.json();
  434 |       const token = loginData.data.accessToken;
  435 |       
  436 |       // Get me
  437 |       const meRes = await request.get(`${BASE_URL}/api/v1/auth/me`, {
  438 |         headers: { Authorization: `Bearer ${token}` }
  439 |       });
  440 |       expect(meRes.status()).toBe(200);
  441 |       const meData = await meRes.json();
  442 |       expect(meData.success).toBe(true);
  443 |       expect(meData.data).toHaveProperty('email');
  444 |     });
  445 |   });
  446 | 
  447 |   // ============================================================
  448 |   // ERROR HANDLING TESTS
  449 |   // ============================================================
  450 |   test.describe('ERROR HANDLING', () => {
  451 |     test('EH1 - No console errors on login page', async ({ page }) => {
  452 |       const errors: string[] = [];
  453 |       page.on('console', msg => {
  454 |         if (msg.type() === 'error') errors.push(msg.text());
  455 |       });
  456 |       await page.goto(`${BASE_URL}/login`);
  457 |       await page.waitForTimeout(2000);
  458 |       expect(errors.filter(e => !e.includes('Download'))).toHaveLength(0);
  459 |     });
  460 | 
  461 |     test('EH2 - No console errors on dashboard', async ({ page }) => {
  462 |       const errors: string[] = [];
  463 |       page.on('console', msg => {
  464 |         if (msg.type() === 'error') errors.push(msg.text());
  465 |       });
  466 |       await page.goto(`${BASE_URL}/login`);
  467 |       await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  468 |       await page.fill('input[type="password"]', 'Vekil2026!');
  469 |       await page.click('button[type="submit"]');
  470 |       await page.waitForURL('**/dashboard', { timeout: 10000 });
  471 |       await page.waitForTimeout(3000);
  472 |       expect(errors.filter(e => !e.includes('Download'))).toHaveLength(0);
  473 |     });
  474 |   });
  475 | });
```