import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * The seller's live monitor and Conclude Now (End Now until 2026-11-28): the seller watches their auction's bids
 * arrive by name and, once it has a bid and its reserve is met, ends it at once; the highest
 * bidder wins as at any close. Runs against a LOCAL backend on the *_test database: each test lists
 * its own item through the API (a throwaway seller, approved by the fixture admin) so the seeded
 * auctions the other specs read are never ended.
 */

const API = process.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(API)) {
  throw new Error(`seller-end-now.spec.ts only runs against a local backend, not "${API}".`);
}

// The fixture accounts of the backend tests (backend/tests/helpers/world.ts); the local test DB only.
const FIXTURE_PASSWORD = 'test-password-123';
const ADMIN = 'admin@test.local';
const BIDDER = { email: 'buyer@test.local', name: 'Test Buyer' };
const OTHER_SELLER = 'seller@test.local';
const PASSWORD = `Bv!${crypto.randomUUID()}x9`;
let n = 0;

interface Seller { email: string; token: string }

async function login(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.ok(), `login ${email}`).toBeTruthy();
  return ((await res.json()) as { data: { accessToken: string } }).data.accessToken;
}

/** A new account that has just become a seller. */
async function newSeller(request: APIRequestContext): Promise<Seller> {
  const email = `endnow-${Date.now()}-${++n}@test.local`;
  const reg = await request.post(`${API}/auth/register`, { data: { name: 'End Now Seller', email, password: PASSWORD } });
  expect(reg.ok(), 'register').toBeTruthy();
  const { data } = (await reg.json()) as { data: { verificationCode: string } };
  expect((await request.post(`${API}/auth/verify-email`, { data: { email, otp: data.verificationCode } })).ok()).toBeTruthy();
  const token = await login(request, email, PASSWORD);
  const enrol = await request.post(`${API}/seller/enroll`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { acceptTerms: true, termsVersion: '2026-10', confirmAdult: true, city: 'Lahore', province: 'Punjab' },
  });
  expect(enrol.ok(), 'enrol').toBeTruthy();
  return { email, token };
}

/** Lists an item at PKR 10,000 with a reserve of 12,000 and has the admin approve it: it goes live. */
async function liveAuction(request: APIRequestContext, seller: Seller) {
  const title = `End Now Spec Item ${Date.now()}-${++n}`;
  const listed = await request.post(`${API}/listings`, {
    headers: { Authorization: `Bearer ${seller.token}` },
    data: {
      title, category: 'Electronics & Gadgets', condition: 'USED', description: 'Listed by the End Now browser specs.',
      startPrice: 10_000, reservePrice: 12_000, minIncrement: 500, durationDays: 5, attributes: { brand: 'Canon', model: 'AE-1' },
    },
  });
  expect(listed.status(), 'list an item').toBe(201);
  const { data: listing } = (await listed.json()) as { data: { listingId: string } };
  const approved = await request.post(`${API}/listings/${listing.listingId}/approve`, {
    headers: { Authorization: `Bearer ${await login(request, ADMIN, FIXTURE_PASSWORD)}` },
  });
  expect(approved.ok(), 'approve').toBeTruthy();
  const { data } = (await approved.json()) as { data: { auctionId: string } };
  return { auctionId: data.auctionId, title };
}

async function bid(request: APIRequestContext, auctionId: string, amount: number) {
  const res = await request.post(`${API}/auctions/${auctionId}/bids`, {
    headers: { Authorization: `Bearer ${await login(request, BIDDER.email, FIXTURE_PASSWORD)}` },
    data: { amount },
  });
  expect(res.status(), `bid ${amount}`).toBe(201);
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByPlaceholder('you@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe('The seller live monitor', () => {
  test('offers Conclude Now only once there is a bid and the reserve is met, and shows each bid by name as it arrives', async ({ page, request }) => {
    const seller = await newSeller(request);
    const { auctionId } = await liveAuction(request, seller);
    await signIn(page, seller.email, PASSWORD);
    await page.goto(`/seller/auctions/${auctionId}/live`);

    await expect(page.getByRole('heading', { name: 'Live Monitor' })).toBeVisible();
    await expect(page.getByText(/^No bids yet\. An auction can be concluded early once it has a bid/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Conclude now and sell' })).toHaveCount(0);

    // A bid under the reserve arrives over the socket, by name; still nothing to end.
    await bid(request, auctionId, 10_000);
    await expect(page.getByText(BIDDER.name)).toBeVisible();
    await expect(page.getByText('Reserve not met yet')).toBeVisible();
    await expect(page.getByText('The reserve price has not been met, so the auction cannot be concluded early yet.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Conclude now and sell' })).toHaveCount(0);

    await bid(request, auctionId, 12_000);
    await expect(page.getByText('Reserve met')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Conclude now and sell' })).toBeVisible();

    // Leave no live auction behind: the guest specs count the live ones.
    const ended = await request.post(`${API}/auctions/${auctionId}/end-now`, {
      headers: { Authorization: `Bearer ${seller.token}` },
      data: { expectedBid: 12_000 },
    });
    expect(ended.ok(), 'end it').toBeTruthy();
  });

  test('Conclude Now sells it to the highest bidder, and the bidder watching the auction is taken to the result', async ({ page, request, browser }) => {
    const seller = await newSeller(request);
    const { auctionId } = await liveAuction(request, seller);
    await bid(request, auctionId, 12_000);

    // The bidder has the auction page open with time still on the clock.
    const bidderContext = await browser.newContext();
    const bidderPage = await bidderContext.newPage();
    await signIn(bidderPage, BIDDER.email, FIXTURE_PASSWORD);
    await bidderPage.goto(`/auctions/${auctionId}`);
    await expect(bidderPage.getByText('You are the highest bidder')).toBeVisible();

    await signIn(page, seller.email, PASSWORD);
    await page.goto(`/seller/auctions/${auctionId}/live`);
    await page.getByRole('button', { name: 'Conclude now and sell' }).click();

    const dialog = page.getByRole('dialog', { name: 'Conclude the auction now?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(BIDDER.name)).toBeVisible();
    await expect(dialog.getByText('PKR 12,000')).toBeVisible();
    await dialog.getByRole('button', { name: 'Conclude now and sell' }).click();

    await expect(dialog).toHaveCount(0);
    await expect(page.getByText(/This auction has ended\. Sold to Test Buyer for PKR 12,000/)).toBeVisible();
    await expect(page.getByText('Ended', { exact: true })).toBeVisible();

    // The `auction:ended` event refetches the bidder's auction: its clock runs out and they are
    // taken to their result.
    await expect(bidderPage).toHaveURL(new RegExp(`/buyer/auction-won/${auctionId}$`), { timeout: 15_000 });
    await bidderContext.close();
  });

  test('the auction page shows the reserve become met live, without a reload', async ({ page, request }) => {
    const seller = await newSeller(request);
    const { auctionId } = await liveAuction(request, seller);

    // A guest is told the price and the count over the socket; whether the reserve is met is
    // refetched while it still reads "not met".
    await page.goto(`/auctions/${auctionId}`);
    await bid(request, auctionId, 10_000);
    await expect(page.getByText(/^Reserve not met/)).toBeVisible();
    await bid(request, auctionId, 12_000);
    await expect(page.getByText('Reserve met — this item will sell')).toBeVisible();
    await expect(page.getByText(/^Reserve not met/)).toHaveCount(0);

    // Leave no live auction behind: the guest specs count the live ones.
    const ended = await request.post(`${API}/auctions/${auctionId}/end-now`, {
      headers: { Authorization: `Bearer ${seller.token}` },
      data: { expectedBid: 12_000 },
    });
    expect(ended.ok(), 'end it').toBeTruthy();
  });

  test('the custom bid button names the typed amount, and no amount while the box is empty', async ({ page, request }) => {
    const seller = await newSeller(request);
    const { auctionId } = await liveAuction(request, seller);
    await signIn(page, OTHER_SELLER, FIXTURE_PASSWORD);
    await page.goto(`/auctions/${auctionId}`);

    await expect(page.getByRole('button', { name: 'Place custom bid' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Place bid of PKR 10,000$/ })).toHaveCount(0);
    await page.getByLabel('Custom amount (PKR)').fill('15500');
    await expect(page.getByRole('button', { name: 'Place bid of PKR 15,500' })).toBeVisible();

    const cancelled = await request.post(`${API}/auctions/${auctionId}/cancel`, {
      headers: { Authorization: `Bearer ${seller.token}` },
      data: { reason: 'Cleaning up after the End Now spec.' },
    });
    expect(cancelled.ok(), 'cancel it').toBeTruthy();
  });

  test('the custom amount takes digits only, and a bad amount is explained in a popup', async ({ page, request }) => {
    const seller = await newSeller(request);
    const { auctionId } = await liveAuction(request, seller);
    await signIn(page, OTHER_SELLER, FIXTURE_PASSWORD);
    await page.goto(`/auctions/${auctionId}`);
    const field = page.getByLabel('Custom amount (PKR)');

    // A minus sign, a decimal point and an exponent cannot be typed.
    await field.pressSequentially('-5e.3');
    await expect(field).toHaveValue('53');

    // Empty: the popup asks for an amount, and "Enter amount" puts the cursor back in the field.
    await field.fill('');
    await page.getByRole('button', { name: 'Place custom bid' }).click();
    const empty = page.getByRole('alertdialog', { name: 'Enter a bid amount' });
    await expect(empty).toContainText('The minimum for this auction is PKR 10,000.');
    await empty.getByRole('button', { name: 'Enter amount' }).click();
    await expect(empty).toHaveCount(0);
    await expect(field).toBeFocused();

    // Too high: starting price 10,000, so the server's ceiling is 100 times that.
    await field.fill('2500000');
    await page.getByRole('button', { name: 'Place bid of PKR 2,500,000' }).click();
    const high = page.getByRole('alertdialog', { name: 'Bid too high' });
    await expect(high).toContainText('accepts bids up to PKR 1,000,000');
    await high.getByRole('button', { name: 'Change amount' }).click();
    await expect(high).toHaveCount(0);

    // Too low: the popup sets out the minimum and offers to bid it.
    await field.fill('9000');
    await expect(page.getByText('Minimum bid is PKR 10,000')).toBeVisible();
    await page.getByRole('button', { name: 'Place bid of PKR 9,000' }).click();
    const low = page.getByRole('alertdialog', { name: 'Bid too low' });
    await expect(low).toContainText('PKR 9,000');
    await expect(low).toContainText('Minimum you can bid');
    await low.getByRole('button', { name: 'Bid PKR 10,000' }).click();
    const confirm = page.getByRole('dialog', { name: 'Confirm Your Bid' });
    await confirm.getByRole('button', { name: /Confirm Bid/ }).click();
    await expect(page.getByText('Your bid of PKR 10,000 was placed successfully.')).toBeVisible();
    // The placed amount does not linger in the field (it would now read as too low).
    await expect(field).toHaveValue('');
    await expect(page.getByText(/^Minimum bid is PKR/)).toHaveCount(0);

    // Leave no live auction behind: the guest specs count the live ones.
    await bid(request, auctionId, 12_000);
    const ended = await request.post(`${API}/auctions/${auctionId}/end-now`, {
      headers: { Authorization: `Bearer ${seller.token}` },
      data: { expectedBid: 12_000 },
    });
    expect(ended.ok(), 'end it').toBeTruthy();
  });

  test('a bid the server refuses because another landed first is explained in a popup, not a toast', async ({ page, request }) => {
    const seller = await newSeller(request);
    const { auctionId } = await liveAuction(request, seller);
    await signIn(page, OTHER_SELLER, FIXTURE_PASSWORD);
    await page.goto(`/auctions/${auctionId}`);

    await page.getByLabel('Custom amount (PKR)').fill('10000');
    await page.getByRole('button', { name: 'Place bid of PKR 10,000' }).click();
    const confirm = page.getByRole('dialog', { name: 'Confirm Your Bid' });
    await expect(confirm).toBeVisible();
    // Someone else bids the same amount while the confirmation is open.
    await bid(request, auctionId, 10_000);
    await confirm.getByRole('button', { name: /Confirm Bid/ }).click();

    const refused = page.getByRole('alertdialog', { name: 'Bid not placed' });
    await expect(refused).toContainText('Bid must be at least PKR 10,500.');
    await refused.getByRole('button', { name: 'OK' }).click();
    await expect(refused).toHaveCount(0);
    // The panel has caught up with the bid that landed first.
    await expect(page.getByText('Min next: PKR 10,500')).toBeVisible();

    await bid(request, auctionId, 12_000);
    const ended = await request.post(`${API}/auctions/${auctionId}/end-now`, {
      headers: { Authorization: `Bearer ${seller.token}` },
      data: { expectedBid: 12_000 },
    });
    expect(ended.ok(), 'end it').toBeTruthy();
  });

  test('another seller cannot open it, and My Items links to it from a live item', async ({ page, request }) => {
    const seller = await newSeller(request);
    const { auctionId, title } = await liveAuction(request, seller);

    await signIn(page, OTHER_SELLER, FIXTURE_PASSWORD);
    await page.goto(`/seller/auctions/${auctionId}/live`);
    await expect(page.getByText('Auction not found')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Conclude now and sell' })).toHaveCount(0);

    await page.context().clearCookies();
    await signIn(page, seller.email, PASSWORD);
    await page.goto('/seller/items?tab=live');
    const row = page.locator('article, li, div').filter({ hasText: title }).filter({ has: page.getByRole('link', { name: 'Watch live' }) }).last();
    await row.getByRole('link', { name: 'Watch live' }).click();
    await expect(page).toHaveURL(new RegExp(`/seller/auctions/${auctionId}/live$`));
    await expect(page.getByRole('heading', { name: 'Live Monitor' })).toBeVisible();

    // Leave no live auction behind: the guest specs count the live ones.
    const cancelled = await request.post(`${API}/auctions/${auctionId}/cancel`, {
      headers: { Authorization: `Bearer ${seller.token}` },
      data: { reason: 'Cleaning up after the End Now spec.' },
    });
    expect(cancelled.ok(), 'cancel it').toBeTruthy();
  });
});
