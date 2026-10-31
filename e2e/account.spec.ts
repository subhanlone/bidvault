import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * B5, PR 2: one account buys and sells.
 *
 * A fresh account is created through the API of the local development backend (the dev server
 * returns the e-mail code in the register response, which production never does), then everything
 * a person does with it is done through the screens. Nothing here signs in to a deployment:
 * playwright.config.ts refuses a production BASE_URL, and the API address is checked below too.
 *
 * Serial on purpose: the tests walk one account from "just registered" to "seller and back", and
 * the login limiter allows only so many sign-ins per quarter hour.
 */

const API = process.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(API)) {
  throw new Error(`account.spec.ts only runs against a local backend, not "${API}".`);
}

// Generated per run: a test value for a throwaway account in the local development database.
const PASSWORD = `Bv!${crypto.randomUUID()}x9`;
const stamp = Date.now();
const EMAIL = `acct-${stamp}@test.local`;

async function createVerifiedAccount(request: APIRequestContext, email: string, name: string) {
  const registered = await request.post(`${API}/auth/register`, { data: { name, email, password: PASSWORD } });
  expect(registered.ok(), 'register without a role').toBeTruthy();
  const { data } = (await registered.json()) as { data: { verificationCode: string } };
  const verified = await request.post(`${API}/auth/verify-email`, { data: { email, otp: data.verificationCode } });
  expect(verified.ok(), 'verify e-mail').toBeTruthy();
}

async function signIn(page: Page, email = EMAIL) {
  await page.goto('/login');
  await page.getByPlaceholder('you@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  // Done once the app has moved off the login page; navigating before that cancels the sign-in.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

async function becomeSeller(page: Page) {
  await page.getByLabel('City').fill('Lahore');
  await page.getByLabel('Province').selectOption('Punjab');
  await page.getByLabel(/I accept the seller terms/i).check();
  await page.getByLabel(/I am 18 or older/i).check();
  await page.getByRole('button', { name: 'Become a seller' }).click();
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ request }) => {
  await createVerifiedAccount(request, EMAIL, 'Account Model Probe');
});

test.describe('Register', () => {
  test('has no Buyer/Seller choice and says selling can come later', async ({ page }) => {
    await page.goto('/register');
    // Wait for the form first: a count of zero is also what an unrendered page looks like.
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.getByText('I want to', { exact: false })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Seller\b/ })).toHaveCount(0);
    await expect(page.getByText(/Want to sell too\?/)).toBeVisible();
  });

  test('sends no role to the server', async ({ page }) => {
    await page.goto('/register?role=SELLER');
    const bodies: string[] = [];
    page.on('request', (r) => { if (r.url().endsWith('/auth/register')) bodies.push(r.postData() ?? ''); });
    await page.getByPlaceholder('Your full name').fill('No Role Probe');
    await page.getByPlaceholder('you@email.com').fill(`norole-${stamp}@test.local`);
    await page.getByPlaceholder('Min. 8 characters').fill(PASSWORD);
    // The box itself is visually hidden; the square next to the sentence is what a person clicks.
    await page.locator('label[for="terms-agree"]').click();
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/email-verification/);
    expect(bodies).toHaveLength(1);
    expect(JSON.parse(bodies[0])).not.toHaveProperty('role');
  });
});

test.describe('A new account', () => {
  test('lands on browse, sees a Sell link and no switch', async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/buyer\/browse/);
    await expect(page.getByRole('link', { name: 'Sell', exact: true })).toBeVisible();
    // The Sell link is rendered, so the navbar is too: a missing switch now means it is not there.
    await expect(page.getByText('Switch to selling')).toHaveCount(0);
  });

  test('is sent to Become a seller from any seller screen', async ({ page }) => {
    await signIn(page);
    await expect(page).toHaveURL(/buyer\/browse/);
    for (const path of ['/seller/dashboard', '/seller/items', '/seller/create-listing/step-1']) {
      await page.goto(path);
      await expect(page).toHaveURL(/become-a-seller/);
    }
  });

  test('cannot become a seller without the terms, the age box and a location', async ({ page }) => {
    await signIn(page);
    await page.goto('/become-a-seller');
    await page.getByRole('button', { name: 'Become a seller' }).click();
    await expect(page).toHaveURL(/become-a-seller/);
    await expect(page.getByText(/accept the seller terms/i).last()).toBeVisible();
    await expect(page.getByText(/City is required/i)).toBeVisible();
    await expect(page.getByText(/Choose your province/i)).toBeVisible();
  });

  test('sees what is public and what is not before agreeing', async ({ page }) => {
    await signIn(page);
    await page.goto('/become-a-seller');
    await expect(page.getByText(/Your email and phone number are not shown/i)).toBeVisible();
  });
});

test.describe('Becoming a seller', () => {
  test('works at once, with the same sign-in, and opens the seller side', async ({ page }) => {
    await signIn(page);
    await page.goto('/become-a-seller');
    await becomeSeller(page);
    await expect(page).toHaveURL(/seller\/dashboard/);
    await expect(page.getByRole('link', { name: 'Switch to buying' })).toBeVisible();

    // The screens a plain buyer was refused a minute ago now open, without signing in again.
    await page.goto('/seller/items');
    await expect(page).toHaveURL(/seller\/items/);
    await page.goto('/seller/create-listing/step-1');
    await expect(page).toHaveURL(/step-1/);
  });

  test('switching sides works, and the side last used is where the person starts next', async ({ page }) => {
    await signIn(page);
    // Nothing remembered in a fresh browser, and this account was not a seller before accounts were
    // merged, so it starts on the buying side and is offered the switch.
    await expect(page).toHaveURL(/buyer\/browse/);
    await expect(page.getByRole('link', { name: 'Switch to selling' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sell', exact: true })).toHaveCount(0);

    await page.getByRole('link', { name: 'Switch to selling' }).click();
    await expect(page).toHaveURL(/seller\/dashboard/);
    await expect(page.getByRole('link', { name: 'Switch to buying' })).toBeVisible();

    // Coming back to the app (the login page sends a signed-in person home) opens the selling side.
    await page.goto('/login');
    await expect(page).toHaveURL(/seller\/dashboard/);

    await page.getByRole('link', { name: 'Switch to buying' }).click();
    await expect(page).toHaveURL(/buyer\/browse/);
    await page.goto('/login');
    await expect(page).toHaveURL(/buyer\/browse/);
  });

  test('the mobile menu carries the switch too', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await signIn(page);
    await expect(page).toHaveURL(/buyer\/browse/);
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('link', { name: 'Switch to selling' }).click();
    await expect(page).toHaveURL(/seller\/dashboard/);
    // The menu closes after the switch.
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('link', { name: 'Switch to buying' })).toBeVisible();
  });

  test('Become a seller sends an existing seller on to the dashboard', async ({ page }) => {
    await signIn(page);
    await page.goto('/become-a-seller');
    await expect(page).toHaveURL(/seller\/dashboard/);
  });

  test('a seller can use the buyer screens too', async ({ page }) => {
    await signIn(page);
    for (const path of ['/buyer/browse', '/buyer/my-bids', '/buyer/watchlist', '/buyer/my-wins']) {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/')));
    }
  });
});

test.describe('Signing in returns to the page that asked for it', () => {
  test('a signed-out visitor to Become a seller comes back to it', async ({ page }) => {
    const email = `return-${stamp}@test.local`;
    await page.request.post(`${API}/auth/register`, { data: { name: 'Return Probe', email, password: PASSWORD } })
      .then(async (r) => {
        const { data } = (await r.json()) as { data: { verificationCode: string } };
        await page.request.post(`${API}/auth/verify-email`, { data: { email, otp: data.verificationCode } });
      });
    await page.goto('/become-a-seller');
    await expect(page).toHaveURL(/login/);
    await signIn(page, email);
    await expect(page).toHaveURL(/become-a-seller/);
  });

  test('a protected link is not followed to another site', async ({ page }) => {
    await page.goto('/login?next=https://evil.example/steal');
    await signIn(page);
    await expect(page).toHaveURL(/localhost:5173\/(buyer|seller)\//);
  });
});
