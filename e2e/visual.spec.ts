import { test, expect } from '@playwright/test';

// Visual snapshot tests — run `npx playwright test visual --update-snapshots` once to create baselines

test.describe('Visual — Public pages', () => {
  test('landing page visual', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('landing.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
  });

  test('login page visual', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('login.png', { maxDiffPixelRatio: 0.02 });
  });

  test('register page visual', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('register.png', { maxDiffPixelRatio: 0.02 });
  });
});

test.describe('Visual — Buyer pages', () => {
  test.use({ storageState: 'e2e/.auth/buyer.json' });

  test('browse auctions visual', async ({ page }) => {
    await page.goto('/buyer/browse');
    await page.waitForLoadState('networkidle');
    // Wait for skeletons to resolve
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot('buyer-browse.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
  });

  test('my bids visual', async ({ page }) => {
    await page.goto('/buyer/my-bids');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('buyer-my-bids.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
  });

  test('my wins visual', async ({ page }) => {
    await page.goto('/buyer/my-wins');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('buyer-my-wins.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
  });

  test('watchlist visual', async ({ page }) => {
    await page.goto('/buyer/watchlist');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('buyer-watchlist.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
  });
});

test.describe('Visual — Admin pages', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('admin dashboard visual', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('admin-dashboard.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
  });

  test('admin listing reviews visual', async ({ page }) => {
    await page.goto('/admin/listing-reviews');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('admin-listing-reviews.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
  });

  test('admin analytics visual', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('admin-analytics.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
  });
});

test.describe('Visual — Seller pages', () => {
  test.use({ storageState: 'e2e/.auth/seller.json' });

  test('seller dashboard visual', async ({ page }) => {
    await page.goto('/seller/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('seller-dashboard.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
  });

  test('create listing step 1 visual', async ({ page }) => {
    await page.goto('/seller/create-listing/step-1');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('seller-create-step1.png', { fullPage: true, maxDiffPixelRatio: 0.03 });
  });
});
