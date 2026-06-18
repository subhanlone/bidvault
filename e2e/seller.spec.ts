import { test, expect } from '@playwright/test';

test.describe('Seller — Dashboard', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto('/seller/dashboard');
    await expect(page).toHaveURL(/seller\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('create listing button is visible', async ({ page }) => {
    await page.goto('/seller/dashboard');
    await expect(page.getByRole('link', { name: /create listing|new listing/i })).toBeVisible();
  });

  test('reviews panel is visible', async ({ page }) => {
    await page.goto('/seller/dashboard');
    await expect(page.getByRole('heading', { name: /reviews/i })).toBeVisible();
  });
});

test.describe('Seller — Create Listing Wizard', () => {
  test('step 1 loads with form fields', async ({ page }) => {
    await page.goto('/seller/create-listing/step-1');
    await expect(page).toHaveURL(/step-1/);
    await expect(page.getByPlaceholder(/Samsung Galaxy|e\.g\./i)).toBeVisible();
  });

  test('step 1 requires title before proceeding', async ({ page }) => {
    await page.goto('/seller/create-listing/step-1');
    await page.getByRole('button', { name: /next|continue/i }).click();
    await expect(page).toHaveURL(/step-1/);
  });

  test('step 1 title field accepts input', async ({ page }) => {
    await page.goto('/seller/create-listing/step-1');
    const titleField = page.getByPlaceholder(/Samsung Galaxy|e\.g\./i);
    await titleField.fill('Test Auction Item');
    await expect(titleField).toHaveValue('Test Auction Item');
  });

  test('step 2 loads', async ({ page }) => {
    await page.goto('/seller/create-listing/step-2');
    await expect(page).toHaveURL(/step-2/);
  });

  test('step 4 loads with pricing fields', async ({ page }) => {
    await page.goto('/seller/create-listing/step-4');
    await expect(page).toHaveURL(/step-4/);
    await expect(page.getByText(/price|starting|reserve/i).first()).toBeVisible();
  });

  test('step-3 redirect goes to step-4', async ({ page }) => {
    await page.goto('/seller/create-listing/step-3');
    await expect(page).toHaveURL(/step-4/);
  });
});

test.describe('Seller — Route guards', () => {
  test('unauthenticated user redirected from dashboard', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto('/seller/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
    await ctx.close();
  });
});
