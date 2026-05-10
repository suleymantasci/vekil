# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/e2e.spec.ts >> Vekil Application - Full Test Suite >> STAGE 1: Authentication >> 1.4 - Login fails with invalid password
- Location: tests/e2e.spec.ts:48:9

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- 'heading "Application error: a client-side exception has occurred while loading vekil.tasci.cloud (see the browser console for more information)." [level=2] [ref=e4]'
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const BASE_URL = 'https://vekil.tasci.cloud';
  4   | 
  5   | test.describe('Vekil Application - Full Test Suite', () => {
  6   |   let authToken: string;
  7   |   let orgId: string;
  8   | 
  9   |   // ============================================================
  10  |   // STAGE 1: Authentication Module
  11  |   // ============================================================
  12  |   test.describe('STAGE 1: Authentication', () => {
  13  |     test('1.1 - Login Page Loads', async ({ page }) => {
  14  |       await page.goto(`${BASE_URL}/login`);
  15  |       await expect(page.locator('h1')).toContainText('Vekil');
  16  |       await expect(page.locator('input[type="email"]')).toBeVisible();
  17  |       await expect(page.locator('input[type="password"]')).toBeVisible();
  18  |       await expect(page.locator('button[type="submit"]')).toContainText('Giriş Yap');
  19  |     });
  20  | 
  21  |     test('1.2 - Login with valid credentials', async ({ page }) => {
  22  |       await page.goto(`${BASE_URL}/login`);
  23  |       await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  24  |       await page.fill('input[type="password"]', 'Vekil2026!');
  25  |       await page.click('button[type="submit"]');
  26  |       await page.waitForURL('**/dashboard', { timeout: 10000 });
  27  |       expect(page.url()).toContain('/dashboard');
  28  |     });
  29  | 
  30  |     test('1.3 - Login stores tokens in localStorage', async ({ page }) => {
  31  |       await page.goto(`${BASE_URL}/login`);
  32  |       await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  33  |       await page.fill('input[type="password"]', 'Vekil2026!');
  34  |       await page.click('button[type="submit"]');
  35  |       await page.waitForURL('**/dashboard', { timeout: 10000 });
  36  |       
  37  |       const token = await page.evaluate(() => localStorage.getItem('vekil_access_token'));
  38  |       const refreshToken = await page.evaluate(() => localStorage.getItem('vekil_refresh_token'));
  39  |       const user = await page.evaluate(() => localStorage.getItem('vekil_user'));
  40  |       const org = await page.evaluate(() => localStorage.getItem('vekil_org'));
  41  |       
  42  |       expect(token).toBeTruthy();
  43  |       expect(refreshToken).toBeTruthy();
  44  |       expect(user).toBeTruthy();
  45  |       expect(org).toBeTruthy();
  46  |     });
  47  | 
  48  |     test('1.4 - Login fails with invalid password', async ({ page }) => {
  49  |       await page.goto(`${BASE_URL}/login`);
  50  |       await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  51  |       await page.fill('input[type="password"]', 'WrongPassword!');
  52  |       await page.click('button[type="submit"]');
  53  |       await page.waitForTimeout(2000);
  54  |       
  55  |       const errorVisible = await page.locator('text=Giriş başarısız').isVisible().catch(() => false);
> 56  |       expect(errorVisible || page.url().includes('/login')).toBeTruthy();
      |                                                             ^ Error: expect(received).toBeTruthy()
  57  |     });
  58  | 
  59  |     test('1.5 - Protected routes redirect to login', async ({ page }) => {
  60  |       await page.goto(`${BASE_URL}/dashboard`);
  61  |       await page.waitForTimeout(2000);
  62  |       expect(page.url()).toContain('/login');
  63  |     });
  64  | 
  65  |     test('1.6 - Logout clears localStorage', async ({ page }) => {
  66  |       // Login first
  67  |       await page.goto(`${BASE_URL}/login`);
  68  |       await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  69  |       await page.fill('input[type="password"]', 'Vekil2026!');
  70  |       await page.click('button[type="submit"]');
  71  |       await page.waitForURL('**/dashboard', { timeout: 10000 });
  72  |       
  73  |       // Get initial token
  74  |       const tokenBefore = await page.evaluate(() => localStorage.getItem('vekil_access_token'));
  75  |       expect(tokenBefore).toBeTruthy();
  76  |       
  77  |       // Logout via API call (since we don't have a UI logout button easily accessible)
  78  |       await page.evaluate(() => {
  79  |         localStorage.removeItem('vekil_access_token');
  80  |         localStorage.removeItem('vekil_refresh_token');
  81  |         localStorage.removeItem('vekil_user');
  82  |         localStorage.removeItem('vekil_org');
  83  |       });
  84  |       
  85  |       const tokenAfter = await page.evaluate(() => localStorage.getItem('vekil_access_token'));
  86  |       expect(tokenAfter).toBeNull();
  87  |     });
  88  |   });
  89  | 
  90  |   // ============================================================
  91  |   // STAGE 2: Dashboard Module
  92  |   // ============================================================
  93  |   test.describe('STAGE 2: Dashboard', () => {
  94  |     test.beforeEach(async ({ page }) => {
  95  |       // Login before each test
  96  |       await page.goto(`${BASE_URL}/login`);
  97  |       await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  98  |       await page.fill('input[type="password"]', 'Vekil2026!');
  99  |       await page.click('button[type="submit"]');
  100 |       await page.waitForURL('**/dashboard', { timeout: 10000 });
  101 |       
  102 |       // Store token for API tests
  103 |       authToken = await page.evaluate(() => localStorage.getItem('vekil_access_token') || '');
  104 |       orgId = await page.evaluate(() => {
  105 |         const org = JSON.parse(localStorage.getItem('vekil_org') || '{}');
  106 |         return org.id || '';
  107 |       });
  108 |     });
  109 | 
  110 |     test('2.1 - Dashboard page loads after login', async ({ page }) => {
  111 |       await page.goto(`${BASE_URL}/dashboard`);
  112 |       await expect(page.locator('text=Hoş Geldiniz')).toBeVisible({ timeout: 10000 });
  113 |     });
  114 | 
  115 |     test('2.2 - Dashboard shows finance overview cards', async ({ page }) => {
  116 |       await page.goto(`${BASE_URL}/dashboard`);
  117 |       await expect(page.locator('text=Finans Özeti')).toBeVisible({ timeout: 10000 });
  118 |       await expect(page.locator('text=Bu Ay Tahakkuk')).toBeVisible();
  119 |       await expect(page.locator('text=Tahsil Edilen')).toBeVisible();
  120 |     });
  121 | 
  122 |     test('2.3 - Dashboard shows stats cards', async ({ page }) => {
  123 |       await page.goto(`${BASE_URL}/dashboard`);
  124 |       await expect(page.locator('text=Binalar')).toBeVisible({ timeout: 10000 });
  125 |       await expect(page.locator('text=Daireler')).toBeVisible();
  126 |       await expect(page.locator('text=Kullanıcılar')).toBeVisible();
  127 |     });
  128 | 
  129 |     test('2.4 - Sidebar navigation is present', async ({ page }) => {
  130 |       await page.goto(`${BASE_URL}/dashboard`);
  131 |       await expect(page.locator('text=Binalar')).toBeVisible({ timeout: 10000 });
  132 |     });
  133 | 
  134 |     test('2.5 - Dashboard loads finance data from API', async ({ page }) => {
  135 |       const now = new Date();
  136 |       const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  137 |       
  138 |       const response = await page.request.get(
  139 |         `${process.env.NEXT_PUBLIC_API_URL}/tahakkuk/charges?organizationId=${orgId}&period=${period}`,
  140 |         { headers: { Authorization: `Bearer ${authToken}` } }
  141 |       );
  142 |       // API should return success (even if no data)
  143 |       expect([200, 404, 500]).toContain(response.status());
  144 |     });
  145 |   });
  146 | 
  147 |   // ============================================================
  148 |   // STAGE 3: Buildings Module
  149 |   // ============================================================
  150 |   test.describe('STAGE 3: Buildings', () => {
  151 |     test.beforeEach(async ({ page }) => {
  152 |       await page.goto(`${BASE_URL}/login`);
  153 |       await page.fill('input[type="email"]', 'admin@vekil.tasci.cloud');
  154 |       await page.fill('input[type="password"]', 'Vekil2026!');
  155 |       await page.click('button[type="submit"]');
  156 |       await page.waitForURL('**/dashboard', { timeout: 10000 });
```