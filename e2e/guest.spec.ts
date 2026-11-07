import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Guest browsing: anyone can look at BidVault, live or ended; bidding, watching and the list of
 * bids need an account, and signing in returns to the page that asked.
 * Runs against a LOCAL backend whose *_test database holds the seeded auctions, which are found
 * through the public API by title.
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

async function signInOnLoginPage(page: Page, email = EMAIL) {
  await page.getByPlaceholder('you@email.com').fill(email);
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

  test('shows the item number, the same code the listing carries', async ({ page, request }) => {
    const id = await auctionIdOf(request, 'ACTIVE', LIVE);
    const { data } = (await (await request.get(`${API}/auctions/${id}`)).json()) as { data: { listingCode: string } };
    expect(data.listingCode, 'the API serves the item number').toBeTruthy();
    await page.goto(`/auctions/${id}`);
    await expect(page.getByText('Item number', { exact: true })).toBeVisible();
    await expect(page.getByText(data.listingCode, { exact: true })).toBeVisible();
  });

  test('quotes the admin\'s payment and confirmation windows in the buying rules', async ({ page, request }) => {
    const id = await auctionIdOf(request, 'ACTIVE', LIVE);
    const { data } = (await (await request.get(`${API}/settings/public`)).json()) as {
      data: { paymentDeadlineHours: number; reviewTimeoutHours: number };
    };
    await page.goto(`/auctions/${id}`);
    const rules = page.getByRole('region', { name: 'Buying on BidVault' });
    await expect(rules).toContainText(`You pay on BidVault within ${data.paymentDeadlineHours} hours after you win.`);
    await expect(rules).toContainText(`you have ${data.reviewTimeoutHours} hours after it ships to confirm that it arrived or raise a dispute`);
  });

  test('states the buying rules without figures when the settings cannot be read', async ({ page, request }) => {
    const id = await auctionIdOf(request, 'ACTIVE', LIVE);
    await page.route('**/api/v1/settings/public', (route) => route.abort());
    await page.goto(`/auctions/${id}`);
    const rules = page.getByRole('region', { name: 'Buying on BidVault' });
    await expect(rules).toContainText('You pay on BidVault after you win.');
    await expect(rules).toContainText('you confirm that it arrived.');
    await expect(rules).not.toContainText('NaN');
    await expect(rules).not.toContainText(/within \d/);
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
    await expect(page.getByText('Quick Bid')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to bid' })).toHaveCount(0);
  });

  test('a new account created from "Sign in to bid" reaches the same auction after register, verification and sign-in', async ({ page, request }) => {
    const id = await auctionIdOf(request, 'ACTIVE', LIVE);
    const email = `newcomer-${Date.now()}@test.local`;
    await page.goto(`/auctions/${id}`);
    await page.getByRole('link', { name: 'Sign in to bid' }).click();
    await page.getByRole('link', { name: 'Create one free' }).click();
    await expect(page).toHaveURL(/\/register/);

    await page.getByPlaceholder('Your full name').fill('Newcomer Probe');
    await page.getByPlaceholder('you@email.com').fill(email);
    await page.getByPlaceholder('Min. 8 characters').fill(PASSWORD);
    await page.locator('label[for="terms-agree"]').click();
    const registered = page.waitForResponse((r) => r.url().endsWith('/auth/register') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Create Account' }).click();
    const { data } = (await (await registered).json()) as { data: { verificationCode: string } };

    await expect(page).toHaveURL(/email-verification/);
    for (const [i, digit] of [...data.verificationCode].entries()) {
      await page.getByLabel(`Digit ${i + 1}`).fill(digit);
    }
    await page.getByRole('button', { name: /Verify/ }).click();

    // Verified: now the sign-in, which sends the person back to the item they came for.
    await expect(page).toHaveURL(/\/login/);
    await signInOnLoginPage(page, email);
    await expect(page).toHaveURL(new RegExp(`/auctions/${id}$`));
    await expect(page.getByText('Quick Bid')).toBeVisible();
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

test.describe('Home hero', () => {
  test('is one short headline and a search, and the auctions start on the first screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText('Bid on what you want, from sellers across Pakistan.');
    expect(await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), 'a compact headline').toBeLessThanOrEqual(40);
    await expect(page.getByRole('search').getByRole('button', { name: 'Search' })).toBeVisible();
    // The old marketing hero is gone.
    await expect(page.getByText("Pakistan's Smartest")).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Start Bidding' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sell Your Items' })).toHaveCount(0);
    // The first screen already shows what is for sale.
    const ending = page.getByRole('heading', { name: 'Ending soon' });
    await expect(ending).toBeVisible();
    const box = await ending.boundingBox();
    expect(box?.y ?? Infinity, 'Ending soon starts above the fold').toBeLessThan(600);
  });

  test('keeps its colour effects: a red and a green glow over a faint grid, hidden from screen readers', async ({ page }) => {
    await page.goto('/');
    const hero = page.getByRole('heading', { level: 1 }).locator('xpath=ancestor::section[1]');
    await expect(hero).toBeVisible();
    const layers = hero.locator(':scope > [aria-hidden="true"]');
    await expect(layers).toHaveCount(3);
    const backgrounds = await layers.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundImage + '|' + getComputedStyle(el).backgroundColor));
    expect(backgrounds.some((b) => b.includes('linear-gradient')), 'the grid').toBe(true);
    expect(backgrounds.filter((b) => b.includes('rgb(208, 2, 27)') || b.includes('208, 2, 27')).length, 'the red glow').toBeGreaterThanOrEqual(1);
  });

  test('on a phone the search keeps its size and the page does not scroll sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const field = page.getByLabel('Search auctions');
    await expect(field).toBeVisible();
    const box = await field.boundingBox();
    expect(box?.height ?? 0, 'the field is not squashed').toBeGreaterThanOrEqual(48);
    expect(box?.width ?? 0, 'the field spans the width').toBeGreaterThan(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), 'no sideways scroll').toBe(false);
  });

  test('tells a guest that anyone can look around and offers the sign-in', async ({ page }) => {
    await page.goto('/');
    const note = page.getByRole('note');
    await expect(note).toContainText('Anyone can look around.');
    await expect(note).toContainText('With an account you can bid, watch items and sell your own.');
    await note.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows a signed-in person no sign-in banner', async ({ page, request }) => {
    await ensureAccount(request);
    await page.goto('/login');
    await signInOnLoginPage(page);
    await page.waitForURL((url) => !url.pathname.startsWith('/login'));
    await page.goto('/');
    // The session is restored once the cards offer to bid instead of view.
    await expect(page.getByRole('button', { name: /^Bid on / }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('note')).toHaveCount(0);
  });
});

test.describe('Home', () => {
  test('leads with Ending soon auctions that open the auction page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ending soon' })).toBeVisible();
    await page.getByRole('link', { name: LIVE }).first().click();
    await expect(page).toHaveURL(/\/auctions\/[^/]+$/);
    await expect(page.getByRole('heading', { name: LIVE })).toBeVisible();
  });

  test('a search goes to /browse with the words and the category', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Search auctions').fill('Camera');
    await page.getByLabel('Category', { exact: true }).selectOption('Electronics & Gadgets');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/browse\?search=Camera&category=Electronics\+%26\+Gadgets$/);
    await expect(page.getByRole('heading', { name: 'Guest Spec Vintage Camera' })).toBeVisible();
    await expect(page.getByRole('heading', { name: LIVE })).toHaveCount(0);
  });

  test('a category tile goes to /browse for that category', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('region', { name: 'Shop by category' }).getByRole('link', { name: 'Electronics & Gadgets' }).click();
    await expect(page).toHaveURL(/\/browse\?category=Electronics%20%26%20Gadgets$/);
    await expect(page.getByRole('heading', { name: LIVE })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Guest Spec Vintage Camera' })).toBeVisible();
  });

  test('"How it works" in the guest header lands on that section of the home page', async ({ page }) => {
    await page.goto('/browse');
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'How it works' }).click();
    await expect(page).toHaveURL(/\/#how-it-works$/);
    await expect(page.locator('#how-it-works')).toBeInViewport();
  });
});

test.describe('A signed-in member on the same page', () => {
  test('bids through the screen, sees their own bid in the list and is told they are the highest bidder', async ({ page, request }) => {
    await ensureAccount(request);
    const id = await auctionIdOf(request, 'ACTIVE', 'Guest Spec Vintage Camera');
    await page.goto('/login');
    await signInOnLoginPage(page);
    await page.waitForURL((url) => !url.pathname.startsWith('/login'));

    await page.goto(`/auctions/${id}`);
    await expect(page.getByRole('heading', { name: 'Bid History' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to bid' })).toHaveCount(0);
    await expect(page.getByText(/The list of bids is for signed-in members/)).toHaveCount(0);

    await page.getByRole('button', { name: /Min bid/ }).click();
    const confirm = page.getByRole('dialog', { name: 'Confirm Your Bid' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: /Confirm Bid/ }).click();

    await expect(page.getByText('You are the highest bidder')).toBeVisible();
    // The list is masked: the member's own bid reads "You", never a name or an id.
    await expect(page.getByRole('heading', { name: 'Bid History' })).toBeVisible();
    await expect(page.getByText('You', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Highest', { exact: true })).toBeVisible();
  });
});

// What the public pages say about the product has to be what the product does (one account buys and
// sells, the bid list is for members, payment is on BidVault, the contact address is the real one).
test.describe('Public text matches the product', () => {
  test('the home page makes no claim the product contradicts', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'How BidVault Works' })).toBeVisible();
    const body = page.locator('body');
    await expect(body).not.toContainText('Full bid history visible to all participants');
    await expect(body).not.toContainText('contacts you within 24 hours');
    await expect(body).not.toContainText('Register as a seller');
    await expect(body).not.toContainText(/thousands of/i);
    await expect(body).not.toContainText('Trusted by buyers and sellers');
    await expect(page.getByText(/Signed-in bidders also see the full bid list/)).toBeVisible();
  });

  test('the sign-in page tells people what they get, not how it is built', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in to BidVault' })).toBeVisible();
    const body = page.locator('body');
    await expect(body).not.toContainText('Role-based dashboard');
    await expect(body).not.toContainText('JWT');
    await expect(body).not.toContainText('Socket.io');
    await expect(page.getByText('One account to bid and to sell')).toBeVisible();
  });

  test('the privacy policy describes one account, the seller details and the real contact address', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    const body = page.locator('body');
    await expect(body).not.toContainText('selected account role');
    await expect(body).not.toContainText('bidvault.com');
    await expect(body).not.toContainText('May 2026');
    await expect(body).toContainText('Last updated: November 2026');
    await expect(body).toContainText('city and province');
    await expect(body).toContainText('delivery address');
    await expect(page.getByRole('link', { name: 'support@bidvault.tech' }).first()).toBeVisible();
  });

  test('the terms describe instant selling, payment on BidVault and the real contact address', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
    const body = page.locator('body');
    await expect(body).not.toContainText('bidvault.com');
    await expect(body).not.toContainText('May 2026');
    await expect(body).not.toContainText('arrangements are made directly between');
    await expect(body).not.toContainText('before listing privileges are granted');
    await expect(body).toContainText('Last updated: November 2026');
    await expect(page.getByRole('link', { name: 'support@bidvault.tech' }).first()).toBeVisible();
  });
});

test.describe('Live updates', () => {
  test('a guest sees the price and the count change when a member bids, without a reload, and never a bidder name', async ({ browser, request }) => {
    await ensureAccount(request);
    const id = await auctionIdOf(request, 'ACTIVE', 'Guest Spec Vintage Camera');
    // Read where it stands, so the spec also passes when it is run again on the same database.
    const before = ((await (await request.get(`${API}/auctions/${id}`)).json()) as {
      data: { currentBid: number; bidCount: number; minIncrement: number };
    }).data;
    const amount = before.bidCount === 0 ? before.currentBid : before.currentBid + before.minIncrement;
    const pkrText = (n: number) => `PKR ${n.toLocaleString('en-PK')}`;
    const bidsText = (n: number) => `${n} ${n === 1 ? 'bid' : 'bids'}`;

    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    const frames: string[] = [];
    guestPage.on('websocket', (ws) => {
      ws.on('framereceived', (f) => frames.push(typeof f.payload === 'string' ? f.payload : '[binary]'));
    });
    await guestPage.goto(`/auctions/${id}`);
    await expect(guestPage.getByText(pkrText(before.currentBid)).first()).toBeVisible();
    await expect(guestPage.getByText(bidsText(before.bidCount)).first()).toBeVisible();
    // The socket has upgraded to a websocket (its first frame is the upgrade probe) and so has
    // joined this auction's room before the bid is placed.
    await expect.poll(() => frames.length, { message: 'websocket frames received' }).toBeGreaterThan(0);
    await guestPage.waitForTimeout(500);

    const login = await request.post(`${API}/auth/login`, { data: { email: EMAIL, password: PASSWORD } });
    expect(login.ok(), 'sign in as the throwaway member').toBeTruthy();
    const { data: session } = (await login.json()) as { data: { accessToken: string } };
    const bid = await request.post(`${API}/auctions/${id}/bids`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      data: { amount },
    });
    expect(bid.status(), 'the bid was accepted').toBe(201);

    await expect(guestPage.getByText(pkrText(amount)).first()).toBeVisible();
    await expect(guestPage.getByText(bidsText(before.bidCount + 1)).first()).toBeVisible();
    // Numbers only: no bid entry, no bidder pseudonym, and not the `bid:placed` event.
    await expect(guestPage.getByText(/Bidder \d/)).toHaveCount(0);
    expect(frames.some((f) => f.includes('bid:placed')), 'a guest socket is never sent bid:placed').toBe(false);
    expect(frames.some((f) => f.includes('auction:price')), 'a guest socket is sent auction:price').toBe(true);
    expect(frames.join('\n')).not.toMatch(/Bidder \d/);
    await guest.close();
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

  // Removed, not redirected: nothing links to these addresses any more, so they are ordinary
  // unknown addresses.
  test('the old addresses no longer exist', async ({ page, request }) => {
    const id = await auctionIdOf(request, 'ACTIVE', LIVE);
    const gone = ['/buyer/browse', `/buyer/live-bidding/${id}`, '/seller/listings', '/seller/sales', '/buyer/auction-won'];
    for (const path of gone) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: 'Lost the Auction?' })).toBeVisible();
      expect(new URL(page.url()).pathname, 'the address is not rewritten').toBe(path);
    }
  });
});
