import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Guest browsing F3: the public seller profile, Report listing (and the admin Reports screen), and
 * the "What you may not sell" page.
 * Runs against a LOCAL backend whose *_test database holds the guest seed: "Test Seller" (Lahore,
 * Punjab, with a bio and a phone that must never show) sells "Live Test Auction" and other items,
 * and has one review from the buyer of "Closed Test Auction".
 */

const API = process.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(API)) {
  throw new Error(`guest-profile.spec.ts only runs against a local backend, not "${API}".`);
}

const SELLER = 'Test Seller';
const LIVE = 'Live Test Auction';
const OTHER_LIVE = 'Guest Spec Vintage Camera';
const ENDED = 'Closed Test Auction';
const CANCELLED = 'Guest Spec Ceramic Vase';
const SELLER_PHONE = '0300-7654321';
const SELLER_EMAIL = 'seller@test.local';
// The password every account of the backend test fixtures has (backend/tests/helpers/world.ts); the
// local test DB only.
const FIXTURE_PASSWORD = 'test-password-123';
const ADMIN = { email: 'admin@test.local', password: FIXTURE_PASSWORD };

async function auctionIdOf(request: APIRequestContext, status: 'ACTIVE' | 'CLOSED' | 'CANCELLED', title: string) {
  const res = await request.get(`${API}/auctions`, { params: { status, search: title } });
  expect(res.ok(), `list ${status} auctions`).toBeTruthy();
  const { data } = (await res.json()) as { data: { items: { auctionId: string; title: string; sellerId: string }[] } };
  const hit = data.items.find((a) => a.title === title);
  expect(hit, `the seeded ${status} auction "${title}" is in the database`).toBeTruthy();
  return hit!;
}

const PASSWORD = `Bv!${crypto.randomUUID()}x9`;
const RUN = Date.now();
const EMAIL = `profile-${RUN}@test.local`;
// Unique per run: the local test DB keeps reports from earlier runs of this file.
const ADMIN_NOTE = `The photos show a different model (run ${RUN}).`;
let accountReady: Promise<void> | null = null;

function ensureAccount(request: APIRequestContext): Promise<void> {
  accountReady ??= (async () => {
    const registered = await request.post(`${API}/auth/register`, { data: { name: 'Profile Spec Buyer', email: EMAIL, password: PASSWORD } });
    expect(registered.ok(), 'register').toBeTruthy();
    const { data } = (await registered.json()) as { data: { verificationCode: string } };
    const verified = await request.post(`${API}/auth/verify-email`, { data: { email: EMAIL, otp: data.verificationCode } });
    expect(verified.ok(), 'verify e-mail').toBeTruthy();
  })();
  return accountReady;
}

async function signIn(page: Page, email = EMAIL, password = PASSWORD) {
  await page.getByPlaceholder('you@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
}

async function signInFirst(page: Page, email = EMAIL, password = PASSWORD) {
  await page.goto('/login');
  await signIn(page, email, password);
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe('Seller profile', () => {
  test('a guest opens it from the auction page: member since, city, about, items and masked reviews', async ({ page, request }) => {
    const live = await auctionIdOf(request, 'ACTIVE', LIVE);
    await page.goto(`/auctions/${live.auctionId}`);
    await page.getByRole('link', { name: "Seller's other items" }).click();
    await expect(page).toHaveURL(new RegExp(`/sellers/${live.sellerId}$`));

    // The profile header: the section that holds the seller's name (each item card says where it is too).
    const header = page.locator('section').filter({ has: page.getByRole('heading', { level: 1, name: SELLER }) });
    await expect(header).toBeVisible();
    await expect(header.getByText(/^Member since [A-Z][a-z]+ \d{4}$/)).toBeVisible();
    await expect(header.getByText('Located in Lahore, Punjab')).toBeVisible();
    await expect(header.getByText('I sell cameras and furniture.')).toBeVisible();

    const reviews = page.getByRole('region', { name: 'Reviews' });
    await expect(reviews.getByText('Reviewer 1')).toBeVisible();
    await expect(reviews.getByText('Verified purchase')).toBeVisible();
    await expect(reviews.getByText('Exactly as described and well packed.')).toBeVisible();
    await expect(reviews.getByText(ENDED)).toBeVisible();
    // The reviewer's real name is never on the page.
    await expect(page.getByText('Test Buyer')).toHaveCount(0);
  });

  test('"See reviews" on the auction page goes to the reviews on the profile', async ({ page, request }) => {
    const live = await auctionIdOf(request, 'ACTIVE', LIVE);
    await page.goto(`/auctions/${live.auctionId}`);
    await page.getByRole('link', { name: 'See reviews' }).click();
    await expect(page).toHaveURL(new RegExp(`/sellers/${live.sellerId}#reviews$`));
    await expect(page.getByRole('region', { name: 'Reviews' })).toBeVisible();
  });

  test('shows no phone or e-mail anywhere on the page', async ({ page, request }) => {
    const live = await auctionIdOf(request, 'ACTIVE', LIVE);
    await page.goto(`/sellers/${live.sellerId}`);
    await expect(page.getByRole('heading', { level: 1, name: SELLER })).toBeVisible();
    const html = await page.content();
    expect(html).not.toContain(SELLER_PHONE);
    expect(html).not.toContain(SELLER_EMAIL);
  });

  test("lists the seller's live and ended items", async ({ page, request }) => {
    const live = await auctionIdOf(request, 'ACTIVE', LIVE);
    await page.goto(`/sellers/${live.sellerId}`);
    const forSale = page.getByRole('region', { name: 'Items for sale' });
    // A card links its picture and its title to the item, so each title names two links.
    await expect(forSale.getByRole('link', { name: LIVE }).first()).toBeVisible();
    await expect(forSale.getByRole('link', { name: OTHER_LIVE }).first()).toBeVisible();
    const ended = page.getByRole('region', { name: 'Ended' });
    await expect(ended.getByRole('link', { name: ENDED })).toBeVisible();
    // A cancelled (removed) item is not shown as an ended one.
    await expect(page.getByText(CANCELLED)).toHaveCount(0);

    await forSale.getByRole('heading', { name: OTHER_LIVE }).getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1, name: OTHER_LIVE })).toBeVisible();
  });

  test('an ended auction links to the seller too', async ({ page, request }) => {
    const ended = await auctionIdOf(request, 'CLOSED', ENDED);
    await page.goto(`/auctions/${ended.auctionId}`);
    await page.getByRole('region', { name: 'Result' }).getByRole('link', { name: "Seller's other items" }).click();
    await expect(page).toHaveURL(new RegExp(`/sellers/${ended.sellerId}$`));
  });

  test('an unknown seller is a not-found page that keeps the header', async ({ page }) => {
    await page.goto('/sellers/no-such-seller');
    await expect(page.getByRole('heading', { name: 'Seller not found' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });
});

test.describe('Report listing', () => {
  test('a guest pressing Report is sent to sign in and comes back to the same auction', async ({ page, request }) => {
    await ensureAccount(request);
    const live = await auctionIdOf(request, 'ACTIVE', LIVE);
    await page.goto(`/auctions/${live.auctionId}`);
    await page.getByRole('link', { name: 'Sign in to report this listing' }).click();
    await expect(page).toHaveURL(/\/login/);
    await signIn(page);
    await expect(page).toHaveURL(new RegExp(`/auctions/${live.auctionId}$`));
    await expect(page.getByRole('button', { name: 'Report this listing' })).toBeVisible();
  });

  test('a signed-in buyer reports a listing, sees a confirmation, and a repeat says so', async ({ page, request }) => {
    await ensureAccount(request);
    const live = await auctionIdOf(request, 'ACTIVE', LIVE);
    await signInFirst(page);
    await page.goto(`/auctions/${live.auctionId}`);

    await page.getByRole('button', { name: 'Report this listing' }).click();
    const dialog = page.getByRole('dialog', { name: 'Report this listing' });
    await expect(dialog.getByRole('button', { name: 'Send report' })).toBeDisabled();
    await dialog.getByRole('radio', { name: 'Counterfeit or replica' }).check();
    await dialog.getByRole('textbox').fill('The logo on the box is misspelt.');
    await expect(dialog.getByText('32/500')).toBeVisible();
    await dialog.getByRole('button', { name: 'Send report' }).click();
    await expect(dialog.getByText('Thanks. An admin will review this listing.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).toHaveCount(0);

    await page.getByRole('button', { name: 'Report this listing' }).click();
    await page.getByRole('dialog').getByRole('radio', { name: 'Something else' }).check();
    await page.getByRole('dialog').getByRole('button', { name: 'Send report' }).click();
    await expect(page.getByRole('dialog').getByText('You already reported this listing.')).toBeVisible();
  });

  test('the seller sees no Report control on their own listing', async ({ page, request }) => {
    const live = await auctionIdOf(request, 'ACTIVE', LIVE);
    await signInFirst(page, SELLER_EMAIL, FIXTURE_PASSWORD);
    await page.goto(`/auctions/${live.auctionId}`);
    await expect(page.getByRole('heading', { level: 1, name: LIVE })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Report this listing' })).toHaveCount(0);
  });

  test('an admin sees the report and marks it actioned', async ({ page, request }) => {
    await ensureAccount(request);
    const camera = await auctionIdOf(request, 'ACTIVE', OTHER_LIVE);
    const login = await request.post(`${API}/auth/login`, { data: { email: EMAIL, password: PASSWORD } });
    const { data } = (await login.json()) as { data: { accessToken: string } };
    const filed = await request.post(`${API}/auctions/${camera.auctionId}/report`, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
      data: { reason: 'MISLEADING', note: ADMIN_NOTE },
    });
    expect(filed.ok(), 'report through the API').toBeTruthy();

    await signInFirst(page, ADMIN.email, ADMIN.password);
    await page.getByRole('navigation').getByRole('link', { name: /^Reports/ }).click();
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
    const row = page.getByRole('listitem').filter({ hasText: ADMIN_NOTE });
    await expect(row.getByText(OTHER_LIVE)).toBeVisible();
    await expect(row.getByText('Misleading description or photos')).toBeVisible();
    await expect(row.getByText('Profile Spec Buyer')).toBeVisible();
    await row.getByRole('button', { name: 'Mark actioned' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: ADMIN_NOTE })).toHaveCount(0);

    await page.getByRole('tab', { name: 'Actioned' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: ADMIN_NOTE })).toBeVisible();
  });
});

test.describe('What you may not sell', () => {
  test('is reachable from the home footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'What you may not sell' }).click();
    await expect(page).toHaveURL(/\/rules$/);
    await expect(page.getByRole('heading', { level: 1, name: 'What you may not sell' })).toBeVisible();
  });

  test('is linked from the report dialog', async ({ page, request }) => {
    await ensureAccount(request);
    const live = await auctionIdOf(request, 'ACTIVE', LIVE);
    await signInFirst(page);
    await page.goto(`/auctions/${live.auctionId}`);
    await page.getByRole('button', { name: 'Report this listing' }).click();
    const link = page.getByRole('dialog').getByRole('link', { name: 'What you may not sell' });
    await expect(link).toHaveAttribute('href', '/rules');
  });
});
