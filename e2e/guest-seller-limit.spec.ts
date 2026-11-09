import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

/**
 * B5 PR 4: the monthly selling limit on the seller's screens, a paused seller, and the admin's
 * controls (pause, restore, personal limit, the three settings).
 * Runs against a LOCAL backend on the *_test database. Each spec makes its own throwaway seller
 * through the API and, where it needs one, sets the seller up with the admin API first.
 */

const API = process.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(API)) {
  throw new Error(`guest-seller-limit.spec.ts only runs against a local backend, not "${API}".`);
}

// The fixture admin of the backend tests (backend/tests/helpers/world.ts); the local test DB only.
const ADMIN = { email: 'admin@test.local', password: 'test-password-123' };
const PASSWORD = `Bv!${crypto.randomUUID()}x9`;
let n = 0;

interface Seller { email: string; userId: string; token: string }

async function login(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API}/auth/login`, { data: { email, password } });
  expect(res.ok(), `login ${email}`).toBeTruthy();
  const { data } = (await res.json()) as { data: { accessToken: string; user: { userId: string } } };
  return { token: data.accessToken, userId: data.user.userId };
}

/** A new account that has just become a seller. */
async function newSeller(request: APIRequestContext): Promise<Seller> {
  const email = `limit-${Date.now()}-${++n}@test.local`;
  const reg = await request.post(`${API}/auth/register`, { data: { name: "Limit Spec Seller", email, password: PASSWORD } });
  expect(reg.ok(), 'register').toBeTruthy();
  const { data } = (await reg.json()) as { data: { verificationCode: string } };
  expect((await request.post(`${API}/auth/verify-email`, { data: { email, otp: data.verificationCode } })).ok()).toBeTruthy();
  const { token, userId } = await login(request, email, PASSWORD);
  const enrol = await request.post(`${API}/seller/enroll`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { acceptTerms: true, termsVersion: '2026-10', confirmAdult: true, city: 'Lahore', province: 'Punjab' },
  });
  expect(enrol.ok(), 'enrol').toBeTruthy();
  return { email, userId, token };
}

async function asAdmin(request: APIRequestContext) {
  return `Bearer ${(await login(request, ADMIN.email, ADMIN.password)).token}`;
}

async function listItem(request: APIRequestContext, seller: Seller, startPrice = 1_000) {
  const res = await request.post(`${API}/listings`, {
    headers: { Authorization: `Bearer ${seller.token}` },
    data: {
      title: `Limit Spec Item ${++n}`, category: 'Electronics & Gadgets', condition: 'USED',
      description: 'Listed by the limit browser specs.', startPrice, minIncrement: 100, durationDays: 5,
      attributes: { brand: 'Canon', model: 'AE-1' },
    },
  });
  expect(res.status(), 'list an item').toBe(201);
}

async function signIn(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login');
  await page.getByPlaceholder('you@email.com').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe('The monthly limit, for the seller', () => {
  test('My Items shows what is used, the limit, the reset date and the way to graduate', async ({ page, request }) => {
    const seller = await newSeller(request);
    await listItem(request, seller, 20_000);
    await signIn(page, seller.email);
    await page.goto('/seller/items');

    const meter = page.getByRole('region', { name: 'Monthly selling limit' });
    await expect(meter.getByText('1 of 10 items')).toBeVisible();
    await expect(meter.getByText('PKR 20,000 of PKR 150,000')).toBeVisible();
    await expect(meter.getByText(/^Resets on \d{1,2} [A-Z][a-z]+$/)).toBeVisible();
    await expect(meter.getByText('Complete 3 more sales to remove the limit.')).toBeVisible();
  });

  test('at the item limit, the wizard says so on its first step and will not go on', async ({ page, request }) => {
    const seller = await newSeller(request);
    const admin = await asAdmin(request);
    await request.put(`${API}/admin/users/${seller.userId}/seller-limit`, { headers: { Authorization: admin }, data: { items: 1, value: null } });
    await listItem(request, seller);
    await signIn(page, seller.email);
    await page.goto('/seller/create-listing/step-1');

    await expect(page.getByRole('alert').filter({ hasText: "You have reached this month's limit of 1 item." })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  test('a starting price over what is left of the value limit is flagged as it is typed', async ({ page, request }) => {
    const seller = await newSeller(request);
    const admin = await asAdmin(request);
    await request.put(`${API}/admin/users/${seller.userId}/seller-limit`, { headers: { Authorization: admin }, data: { items: null, value: 5_000 } });
    await listItem(request, seller, 2_000);
    await signIn(page, seller.email);
    await page.goto('/seller/create-listing/step-2');

    await page.getByLabel('Starting price (PKR)').fill('4000');
    await expect(page.getByText('PKR 3,000 is left of your PKR 5,000 monthly limit.')).toBeVisible();
    await page.getByLabel('Starting price (PKR)').fill('3000');
    await expect(page.getByText(/is left of your PKR 5,000 monthly limit/)).toHaveCount(0);
  });

  test('asks for a higher limit once a month', async ({ page, request }) => {
    const seller = await newSeller(request);
    await signIn(page, seller.email);
    await page.goto('/seller/items');

    await page.getByRole('button', { name: 'Request a higher limit' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill('I have 40 cameras to sell.');
    await dialog.getByRole('button', { name: 'Send request' }).click();
    await expect(page.getByText('Request sent')).toBeVisible();

    await page.getByRole('button', { name: 'Request a higher limit' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Send request' }).click();
    await expect(page.getByText('You already asked this month')).toBeVisible();
  });
});

test.describe('A paused seller', () => {
  test('is told selling is paused instead of the Become a seller form, and still reaches My Items', async ({ page, request }) => {
    const seller = await newSeller(request);
    const admin = await asAdmin(request);
    const res = await request.post(`${API}/admin/users/${seller.userId}/revoke-seller`, {
      headers: { Authorization: admin }, data: { reason: 'Several items were not as described.' },
    });
    expect(res.ok(), 'revoke').toBeTruthy();
    await signIn(page, seller.email);

    await page.goto('/become-a-seller');
    await expect(page.getByRole('heading', { name: 'Selling is paused on your account' })).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(0);

    await page.getByRole('link', { name: 'Go to My Items' }).click();
    await expect(page).toHaveURL(/\/seller\/items/);
    await expect(page.getByRole('status').filter({ hasText: 'Selling is paused on your account' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'List an item' })).toHaveCount(0);
  });
});

test.describe('The admin', () => {
  test('pauses and restores selling, and sets a personal limit, from the Users screen', async ({ page, request }) => {
    const seller = await newSeller(request);
    await signIn(page, ADMIN.email, ADMIN.password);
    await page.goto('/admin/users');
    await page.getByRole('textbox', { name: 'Search users by name or email' }).fill(seller.email);
    const row = page.getByRole('listitem').filter({ hasText: seller.email });
    await expect(row.getByText('Seller', { exact: true })).toBeVisible();

    await row.getByRole('button', { name: 'Pause selling' }).click();
    const pause = page.getByRole('dialog');
    await expect(pause.getByRole('checkbox', { name: 'End their live auctions too' })).not.toBeChecked();
    await pause.getByRole('textbox').fill('Items not as described.');
    await pause.getByRole('button', { name: 'Pause selling' }).click();
    await expect(row.getByText('Selling paused')).toBeVisible();

    await row.getByRole('button', { name: 'Restore selling' }).click();
    await expect(row.getByText('Seller', { exact: true })).toBeVisible();

    await row.getByRole('button', { name: 'Set limit' }).click();
    const limit = page.getByRole('dialog');
    await limit.getByLabel('Items a month').fill('25');
    await limit.getByRole('button', { name: 'Save limit' }).click();
    await expect(row.getByText('Limit: 25 items a month')).toBeVisible();
  });

  test('sets the three new-seller numbers in Settings', async ({ page }) => {
    await signIn(page, ADMIN.email, ADMIN.password);
    await page.goto('/admin/settings');
    await expect(page.getByLabel('New Seller Items per Month')).toHaveValue('10');
    await expect(page.getByLabel('New Seller Value per Month (PKR)')).toHaveValue('150000');
    await expect(page.getByLabel('Sales to Lift the Limit')).toHaveValue('3');
  });
});
