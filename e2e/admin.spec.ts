import { test, expect } from '@playwright/test';

test.describe('Admin — Dashboard', () => {
  test('dashboard loads with stat cards', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/admin\/dashboard/);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/active auctions/i)).toBeVisible();
  });

  test('sidebar shows all admin nav links', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /listing review/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /live auctions/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /analytics/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
  });
});

test.describe('Admin — Listing Reviews', () => {
  test('listing reviews page loads', async ({ page }) => {
    await page.goto('/admin/listing-reviews');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/listing-reviews/);
    // Either pending queue or empty all-caught-up state
    const hasPending  = await page.getByText(/pending listings queue/i).isVisible().catch(() => false);
    const hasCaughtUp = await page.getByText(/all caught up/i).isVisible().catch(() => false);
    expect(hasPending || hasCaughtUp).toBe(true);
  });
});

test.describe('Admin — Live Auctions', () => {
  test('live auctions page loads', async ({ page }) => {
    await page.goto('/admin/live-auctions');
    await expect(page).toHaveURL(/live-auctions/);
    await expect(page.getByRole('heading', { name: /live auctions/i })).toBeVisible();
  });
});

test.describe('Admin — Analytics', () => {
  test('analytics page loads with charts', async ({ page }) => {
    await page.goto('/admin/analytics');
    await expect(page).toHaveURL(/analytics/);
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
    await expect(page.getByText(/revenue|bids|auctions/i).first()).toBeVisible();
  });

  test('period filter buttons are present', async ({ page }) => {
    await page.goto('/admin/analytics');
    await expect(page.getByRole('button', { name: /7 days/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /30 days/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /12 months/i })).toBeVisible();
  });
});

test.describe('Admin — Settings', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/settings/);
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });
});

test.describe('Admin — Route guards', () => {
  test('unauthenticated user cannot access admin dashboard', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
    await ctx.close();
  });
});
