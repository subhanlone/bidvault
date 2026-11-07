import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Guest browsing: anyone can look at BidVault, live or ended, without an account. Bidding,
 * watching and the list of bids need one, and signing in returns to the page that asked.
 *
 * Runs against a LOCAL backend whose database holds the seeded auctions below (the seed is a
 * script that fills the *_test database; see the pull request). Nothing here touches a
 * deployment: playwright.config.ts refuses a production BASE_URL and the API address is checked.
 *
 * The seeded auctions are found through the public API by title, so no ids are hard-coded.
 */

const API = process.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(API)) {
  throw new Error(`guest.spec.ts only runs against a local backend, not "${API}".`);
}

const LIVE = 'Live Test Auction'; //       1 bid, PKR 21,000, reserve not met yet
const SOLD = 'Closed Test Auction'; //     closed above its reserve, PKR 8,000
const RESERVE_NOT_MET = 'Guest Spec Study Desk'; // closed under its reserve, highest bid PKR 14,000
const CANCELLED = 'Guest Spec Ceramic Vase';

async function auctionIdOf(request: APIRequestContext, status: 'ACTIVE' | 'CLOSED' | 'CANCELLED', title: string) {
  const res = await request.get(`${API}/auctions`, { params: { status, search: title } });
  expect(res.ok(), `list ${status} auctions`).toBeTruthy();
  const { data } = (await res.json()) as { data: { items: { auctionId: string; title: string }[] } };
  const hit = data.items.find((a) => a.title === title);
  expect(hit, `the seeded ${status} auction "${title}" is in the database`).toBeTruthy();
  return hit!.auctionId;
}

// A throwaway account for the specs that sign in: generated per run, local database only.
const PASSWORD = `Bv!${crypto.randomUUID()}x9`;
const EMAIL = `guest-${Date.now()}@test.local`;
let accountReady: Promise<void> | null = null;

function ensureAccount(request: APIRequestContext): Promise<void> {
  accountReady ??= (async () => {
    const registered = await request.post(`${API}/auth/register`, { data: { name: 'Guest Spec Buyer', email: EMAIL, password: PASSWORD } });
    expect(registered.ok(), 'register').toBeTruthy();
    const { data } = (await registered.json()) as { data: { verificationCode: string } };
    const verified = await request.post(`${API}/auth/verify-email`, { data: { email: EMAIL, otp: data.verificationCode } });
    expect(verified.ok(), 'verify e-mail').toBeTruthy();
  })();
  return accountReady;
}

async function signInOnLoginPage(page: Page) {
  await page.getByPlaceholder('you@email.com').fill(EMAIL);
  await page.getByPlaceholder('Your password').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
}

const bidsPath = /\/auctions\/[^/]+\/bids$/;

test.describe('Browse', () => {
  test('a guest opens /browse and sees live auctions with a Sign in and Register header', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.getByRole('heading', { name: 'Live Auctions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: LIVE })).toBeVisible();
    await expect(page.getByText(/You are browsing as a guest/)).toBeVisible();
    const header = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(header.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('a guest card says View, not Bid Now', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.getByRole('button', { name: `View ${LIVE}` })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Bid on / })).toHaveCount(0);
  });

  test('a guest card shows where the item is and who sells it', async ({ page }) => {
    await page.goto('/browse');
    const card = page.getByRole('article').filter({ hasText: LIVE });
    await expect(card.getByText('Located in Lahore, Punjab')).toBeVisible();
    await expect(card.getByText(/Test Seller/)).toBeVisible();
  });

  test('the heart on a card sends a guest to sign in', async ({ page }) => {
    await page.goto('/browse');
    await page.getByRole('link', { name: `Sign in to watch ${LIVE}` }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('The auction page for a guest', () => {
  test('shows price, bid count, end time, seller card and the buying rules', async ({ page, request }) => {
    const id = await auctionIdOf(request, 'ACTIVE', LIVE);
    await page.goto(`/auctions/${id}`);
    await expect(page.getByRole('heading', { name: LIVE })).toBeVisible();
    await expect(page.getByText('PKR 21,000').first()).toBeVisible();
    await expect(page.getByText(/1 bid\b/).first()).toBeVisible();
    await expect(page.getByText(/Ends in/).first()).toBeVisible();
    await expect(page.getByText('Test Seller').first()).toBeVisible();
    await expect(page.getByText('Located in Lahore, Punjab').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Buying on BidVault' })).toBeVisible();
    // The reserve amount is never published; only whether it is met.
    await expect(page.getByText('25,000')).toHaveCount(0);
  });

  test('says the bid list is for signed-in members, and never asks for it', async ({ page, request }) => {
    const id = await auctionIdOf(request, 'ACTIVE', LIVE);
    const asked: string[] = [];
    page.on('request', (r) => { if (bidsPath.test(new URL(r.url()).pathname)) asked.push(`${r.method()} ${r.url()}`); });
    await page.goto(`/auctions/${id}`);
    await expect(page.getByText(/The list of bids is for signed-in members/)).toBeVisible();
    expect(asked).toEqual([]);
  });

  test('"Sign in to bid" goes to /login and signing in returns to the same auction', async ({ page, request }) => {
    await ensureAccount(request);
    const id = await auctionIdOf(request, 'ACTIVE', LIVE);
    await page.goto(`/auctions/${id}`);
    await page.getByRole('link', { name: 'Sign in to bid' }).click();
    await expect(page).toHaveURL(/\/login/);
    await signInOnLoginPage(page);
    await expect(page).toHaveURL(new RegExp(`/auctions/${id}$`));
    // The bid panel replaces the sign-in prompt.
    await expect(page.getByText('Quick Bid')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to bid' })).toHaveCount(0);
  });

  test('a signed-in person whose token has just expired still gets the bid list', async ({ page, request }) => {
    await ensureAccount(request);
    const id = await auctionIdOf(request, 'ACTIVE', LIVE);
    await page.goto('/login');
    await signInOnLoginPage(page);
    await page.waitForURL((url) => !url.pathname.startsWith('/login'));

    // The first answer is a 401, as for an expired access token; the silent refresh must recover it.
    let answered401 = false;
    await page.route(`**/auctions/${id}/bids*`, async (route) => {
      if (!answered401 && route.request().method() === 'GET') {
        answered401 = true;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Missing, invalid or expired access token' }),
        });
        return;
      }
      await route.continue();
    });
    await page.goto(`/auctions/${id}`);
    await expect(page.getByRole('heading', { name: /Bid History/ })).toBeVisible();
    await expect(page.getByText(/The list of bids is for signed-in members/)).toHaveCount(0);
    expect(answered401, 'the 401 was served').toBe(true);
  });

  test('an expired live auction in a guest browser turns into the ended view without leaving the page', async ({ page, request }) => {
    const id = await auctionIdOf(request, 'ACTIVE', LIVE);
    // The server still says ACTIVE for a short while after endTime (the worker closes it); here the
    // first answer ends in three seconds and every later one is the closed auction, as it would be.
    let calls = 0;
    // Only the API call: the page itself is also served at /auctions/<id>.
    await page.route(`**/api/v1/auctions/${id}`, async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as { data: Record<string, unknown> };
      calls += 1;
      body.data = calls === 1
        ? { ...body.data, endTime: new Date(Date.now() + 3_000).toISOString() }
        : { ...body.data, status: 'CLOSED', reserveMet: true, endTime: new Date(Date.now() - 1_000).toISOString() };
      await route.fulfill({ response, json: body });
    });
    await page.goto(`/auctions/${id}`);
    await expect(page.getByRole('heading', { name: LIVE })).toBeVisible();
    await expect(page.getByText(/Item sold on/)).toBeVisible({ timeout: 20_000 });
    expect(new URL(page.url()).pathname).toBe(`/auctions/${id}`);
  });
});

test.describe('Auctions that have ended', () => {
  test('a sold auction shows SOLD with the final price and no bid or watch button', async ({ page, request }) => {
    const id = await auctionIdOf(request, 'CLOSED', SOLD);
    await page.goto(`/auctions/${id}`);
    await expect(page.getByText(/Item sold on/)).toBeVisible();
    await expect(page.getByText('SOLD', { exact: true })).toBeVisible();
    await expect(page.getByText('PKR 8,000').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sell one like this' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to bid' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Sign in to watch' })).toHaveCount(0);
  });

  test('a reserve-not-met auction shows the highest bid and "Not sold"', async ({ page, request }) => {
    const id = await auctionIdOf(request, 'CLOSED', RESERVE_NOT_MET);
    await page.goto(`/auctions/${id}`);
    await expect(page.getByText(/Not sold/).first()).toBeVisible();
    await expect(page.getByText(/reserve not met/i).first()).toBeVisible();
    await expect(page.getByText('Highest bid')).toBeVisible();
    await expect(page.getByText('PKR 14,000').first()).toBeVisible();
    // It is not a sale: no "final price", and the reserve itself is never shown.
    await expect(page.getByText(/Item sold on/)).toHaveCount(0);
    await expect(page.getByText('50,000')).toHaveCount(0);
  });

  test('a cancelled auction says so and shows no reason', async ({ page, request }) => {
    const id = await auctionIdOf(request, 'CANCELLED', CANCELLED);
    await page.goto(`/auctions/${id}`);
    await expect(page.getByText('This auction was cancelled by the seller.')).toBeVisible();
    await expect(page.getByText('No one bought this item and no one was charged.')).toBeVisible();
    await expect(page.getByText(/Reason/i)).toHaveCount(0);
  });
});

test.describe('Addresses', () => {
  test('an unknown auction id shows the not-found page with the header', async ({ page }) => {
    await page.goto('/auctions/not-a-real-auction');
    await expect(page.getByRole('heading', { name: "We couldn't find that auction" })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse live auctions' })).toBeVisible();
  });

  test('/buyer/browse and /buyer/live-bidding/:id redirect to /browse and /auctions/:id', async ({ page, request }) => {
    await page.goto('/buyer/browse');
    await expect(page).toHaveURL(/\/browse$/);
    await expect(page.getByRole('heading', { name: 'Live Auctions' })).toBeVisible();

    const id = await auctionIdOf(request, 'ACTIVE', LIVE);
    await page.goto(`/buyer/live-bidding/${id}`);
    await expect(page).toHaveURL(new RegExp(`/auctions/${id}$`));
    await expect(page.getByRole('heading', { name: LIVE })).toBeVisible();
  });
});
