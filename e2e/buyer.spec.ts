import { test, expect } from '@playwright/test';

test.describe('Buyer — Browse Auctions', () => {
  test('browse page loads with heading', async ({ page }) => {
    await page.goto('/buyer/browse');
    await expect(page.getByRole('heading', { name: /live auctions/i })).toBeVisible();
  });

  test('search input is visible and functional', async ({ page }) => {
    await page.goto('/buyer/browse');
    // Desktop search (hidden md:block) — use the one in the main content area
    const search = page.getByPlaceholder('Search auctions…').last();
    await expect(search).toBeVisible();
    await search.fill('iphone');
    await expect(search).toHaveValue('iphone');
  });

  test('filter sidebar shows category options', async ({ page }) => {
    await page.goto('/buyer/browse');
    await expect(page.getByText(/electronics/i).first()).toBeVisible();
  });

  test('navbar shows all buyer links', async ({ page }) => {
    await page.goto('/buyer/browse');
    await expect(page.getByRole('link', { name: /browse/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /my bids/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /my wins/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /watchlist/i })).toBeVisible();
  });
});

test.describe('Buyer — My Bids', () => {
  test('my bids page loads', async ({ page }) => {
    await page.goto('/buyer/my-bids');
    await expect(page).toHaveURL(/my-bids/);
    await expect(page.getByRole('heading', { name: /my bids/i })).toBeVisible();
  });
});

test.describe('Buyer — My Wins', () => {
  test('my wins page loads', async ({ page }) => {
    await page.goto('/buyer/my-wins');
    await expect(page).toHaveURL(/my-wins/);
    await expect(page.getByRole('heading', { name: /my wins/i })).toBeVisible();
  });

  test('empty state shows browse button when no wins', async ({ page }) => {
    await page.goto('/buyer/my-wins');
    const hasWins = await page.getByText(/pkr|payment/i).first().isVisible().catch(() => false);
    if (!hasWins) {
      const browseBtn = page.getByRole('button', { name: /browse auctions/i });
      await expect(browseBtn).toBeVisible();
      await browseBtn.click();
      await expect(page).toHaveURL(/buyer\/browse/);
    }
  });

  test('rate seller button opens the rating modal', async ({ page }) => {
    await page.goto('/buyer/my-wins');
    const rateBtn = page.getByRole('button', { name: /rate seller/i }).first();
    const hasRateBtn = await rateBtn.isVisible().catch(() => false);
    if (hasRateBtn) {
      await rateBtn.click();
      await expect(page.getByRole('heading', { name: /^rate / })).toBeVisible();
      await expect(page.getByRole('radiogroup', { name: /star rating/i })).toBeVisible();
    }
  });
});

test.describe('Buyer — Watchlist', () => {
  test('watchlist page loads', async ({ page }) => {
    await page.goto('/buyer/watchlist');
    await expect(page).toHaveURL(/watchlist/);
    await expect(page.getByRole('heading', { name: 'Watchlist', exact: true })).toBeVisible();
  });
});

test.describe('Buyer — Profile', () => {
  test('profile page loads with account info', async ({ page }) => {
    await page.goto('/buyer/profile');
    await expect(page).toHaveURL(/profile/);
    await expect(page.getByRole('heading', { name: 'Account Information' })).toBeVisible();
  });
});

test.describe('Buyer — Navigation guards', () => {
  test('unauthenticated user is redirected from browse', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto('/buyer/browse');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/login/, { timeout: 10000 });
    await ctx.close();
  });
});
