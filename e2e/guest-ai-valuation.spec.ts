import { test, expect, type APIRequestContext, type Page, type Route } from '@playwright/test';

/**
 * Agentic AI PR 3: the price-comparison panel on the auction page (for everyone, guests included,
 * decided 2026-11-09). It is a separate, labelled block "via eBay" (eBay's licence: its content is not
 * mixed into BidVault's own), says how old the data is, and gives every state its own calm wording.
 * The API answer is stubbed here (the AI itself is tested in the backend), so each state is exact.
 * Runs against a LOCAL backend on the *_test database (the guest seed's "Live Test Auction").
 */

const API = process.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(API)) {
  throw new Error(`guest-ai-valuation.spec.ts only runs against a local backend, not "${API}".`);
}

const LIVE = 'Live Test Auction';

interface Valuation {
  configured: boolean;
  status: 'QUEUED' | 'RUNNING' | 'READY' | 'INSUFFICIENT_DATA' | 'FAILED' | 'PAUSED' | null;
  averagePricePkr: number | null;
  listingsUsed: number | null;
  listingsConsidered: number | null;
  source: string | null;
  computedAt: string | null;
  refreshing: boolean;
}

const base: Valuation = {
  configured: true, status: null, averagePricePkr: null, listingsUsed: null, listingsConsidered: null,
  source: null, computedAt: null, refreshing: false,
};
const ready = (over: Partial<Valuation> = {}): Valuation => ({
  ...base, status: 'READY', averagePricePkr: 21_933, listingsUsed: 3, listingsConsidered: 4, source: 'EBAY',
  computedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(), ...over,
});

async function liveAuctionId(request: APIRequestContext) {
  const res = await request.get(`${API}/auctions`, { params: { status: 'ACTIVE', search: LIVE } });
  const { data } = (await res.json()) as { data: { items: { auctionId: string; title: string }[] } };
  const hit = data.items.find((a) => a.title === LIVE);
  expect(hit, 'the seeded live auction').toBeTruthy();
  return hit!.auctionId;
}

/** Answers GET /ai/valuations/:id with the given sequence (the last one repeats). */
async function stub(page: Page, answers: Valuation[]) {
  let calls = 0;
  await page.route('**/api/v1/ai/valuations/*', (route: Route) => {
    const body = answers[Math.min(calls++, answers.length - 1)];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: body }) });
  });
  return () => calls;
}

const panel = (page: Page) => page.getByRole('region', { name: /Price comparison/ });

test.describe('AI price comparison panel', () => {
  test('a guest sees an estimate in its own block, marked as from eBay, with its age', async ({ page, request }) => {
    const id = await liveAuctionId(request);
    await stub(page, [ready()]);
    await page.goto(`/auctions/${id}`);

    const p = panel(page);
    await expect(p).toBeVisible();
    await expect(p.getByText('via eBay')).toBeVisible();
    await expect(p.getByText('PKR 21,933')).toBeVisible();
    await expect(p.getByText(/average current bid of 3 comparable eBay auctions/i)).toBeVisible();
    await expect(p.getByText(/not a sale price/i)).toBeVisible();
    await expect(p.getByText(/^Data from 2 h ago$/)).toBeVisible();
  });

  test('while it is being worked out it says so, then shows the result without a reload', async ({ page, request }) => {
    const id = await liveAuctionId(request);
    const calls = await stub(page, [{ ...base, status: 'QUEUED' }, { ...base, status: 'RUNNING' }, ready()]);
    await page.goto(`/auctions/${id}`);

    await expect(panel(page).getByText(/Comparing with eBay auctions/)).toBeVisible();
    await expect(panel(page).getByText('PKR 21,933')).toBeVisible({ timeout: 20_000 });
    expect(calls()).toBeGreaterThanOrEqual(3);
  });

  test('a refresh keeps the last estimate on show and says it is updating', async ({ page, request }) => {
    const id = await liveAuctionId(request);
    await stub(page, [ready({ refreshing: true, computedAt: new Date(Date.now() - 7 * 3_600_000).toISOString() })]);
    await page.goto(`/auctions/${id}`);
    await expect(panel(page).getByText('PKR 21,933')).toBeVisible();
    await expect(panel(page).getByText(/Updating/)).toBeVisible();
  });

  test('a web-search estimate says so instead of eBay', async ({ page, request }) => {
    const id = await liveAuctionId(request);
    await stub(page, [ready({ source: 'WEB' })]);
    await page.goto(`/auctions/${id}`);
    await expect(panel(page).getByText('via web search')).toBeVisible();
  });

  for (const [status, text] of [
    ['INSUFFICIENT_DATA', /Not enough comparable eBay auctions/],
    ['FAILED', /not available right now/],
    ['PAUSED', /paused for today/],
  ] as const) {
    test(`${status} has its own calm wording and no number`, async ({ page, request }) => {
      const id = await liveAuctionId(request);
      await stub(page, [{ ...base, status, computedAt: new Date().toISOString() }]);
      await page.goto(`/auctions/${id}`);
      await expect(panel(page).getByText(text)).toBeVisible();
      await expect(panel(page).getByText(/PKR/)).toHaveCount(0);
      await expect(panel(page).getByRole('alert')).toHaveCount(0);
    });
  }

  test('the panel is not there when the feature is off or there is nothing to show', async ({ page, request }) => {
    const id = await liveAuctionId(request);
    await stub(page, [{ ...base, configured: false }]);
    await page.goto(`/auctions/${id}`);
    await expect(page.getByRole('heading', { level: 1, name: LIVE })).toBeVisible();
    await expect(panel(page)).toHaveCount(0);
  });
});

test.describe('Admin settings', () => {
  test('show the USD to PKR rate the estimate uses', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@email.com').fill('admin@test.local');
    await page.getByPlaceholder('Your password').fill('test-password-123');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await page.goto('/admin/settings');
    await expect(page.getByLabel('USD to PKR Rate (AI estimate)')).toHaveValue('280');
  });
});
