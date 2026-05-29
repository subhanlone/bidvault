import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('loads and shows hero section', async ({ page }) => {
    await expect(page).toHaveTitle(/BidVault/i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Bidding Free/i })).toBeVisible();
  });

  test('shows stats section', async ({ page }) => {
    await expect(page.getByText(/Registered Users|Active Auctions|Buyer Satisfaction/i).first()).toBeVisible();
  });

  test('shows how it works section with buyer and seller tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'For Buyers' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'For Sellers' })).toBeVisible();
  });

  test('seller tab switches content', async ({ page }) => {
    await page.getByRole('button', { name: 'For Sellers' }).click();
    await expect(page.getByText('Create Your Account')).toBeVisible();
  });

  test('nav has login and get started links', async ({ page }) => {
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Log In' })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Get Started/i })).toBeVisible();
  });

  test('footer has privacy and terms links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /terms/i })).toBeVisible();
  });
});
