import { test, expect, type Browser, type Page, type Route } from '@playwright/test';

/**
 * Paying by card, JazzCash, Easypaisa or bank transfer (all simulated), and a refund explained in
 * full. My Wins and the pay call are stubbed, so every state is exact and the pay body can be read:
 * it must carry the chosen method's field and nothing else. The sign-in is real, on a throwaway
 * account made through a LOCAL backend (it returns the e-mail code, which production never does).
 * Serial on one signed-in page: the login limiter allows only a few sign-ins per quarter hour.
 */

const API = process.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(API)) {
  throw new Error(`payment-methods.spec.ts only runs against a local backend, not "${API}".`);
}

// Generated per run: a test value for a throwaway account in the local test database.
const PASSWORD = `Bv!${crypto.randomUUID()}x9`;
const EMAIL = `pay-${Date.now()}@test.local`;

const PENDING = {
  transactionId: 'tx-pending-1', auctionId: 'a-1', auctionTitle: 'Sony WH-1000XM4 Headphones', auctionEmoji: '🎧',
  auctionImageUrl: '', sellerName: 'Sana Seller', finalAmount: 30_000, status: 'PENDING',
  createdAt: new Date().toISOString(), reviewed: false,
};
const REFUNDED = {
  transactionId: 'tx-refunded-1', auctionId: 'a-2', auctionTitle: 'Kindle Paperwhite', auctionEmoji: '📚',
  auctionImageUrl: '', sellerName: 'Sana Seller', finalAmount: 18_500, status: 'REFUNDED',
  createdAt: new Date().toISOString(), reviewed: false,
  payment: { method: 'JAZZCASH', methodLabel: 'JazzCash', accountHint: '0300•••567' },
  refund: {
    amount: 18_500, reason: 'NOT_SHIPPED_SELLER', reasonText: 'The seller could not send the item',
    refundedBy: 'SELLER', note: 'Item broke in storage', refundedAt: new Date().toISOString(),
    refundReference: 'RFD-abcdefghijkl', paymentReference: 'PAY-abc123def456', paidTo: 'JazzCash 0300•••567',
    expectedArrival: 'Immediately (simulated: no real money moves)',
  },
};

// Refunded before the refund record existed: the server sends only the amount and payment reference.
const LEGACY_REFUNDED = {
  transactionId: 'tx-legacy-1', auctionId: 'a-3', auctionTitle: 'Nokia 3310 Classic', auctionEmoji: '📱',
  auctionImageUrl: '', sellerName: 'Sana Seller', finalAmount: 4_000, status: 'REFUNDED',
  createdAt: new Date().toISOString(), reviewed: false,
  payment: { method: 'CARD', methodLabel: 'Card' },
  refund: { amount: 4_000, paymentReference: 'PAY-legacy0001' },
};

const DELIVERY = { deliveryAddress: '12 Canal Road, Gulberg, Lahore', deliveryPhone: '0321 7654321' };

let page: Page;
let sent: Array<Record<string, unknown>> = [];

async function signedInPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  const request = ctx.request;
  const registered = await request.post(`${API}/auth/register`, { data: { name: 'Pay Probe', email: EMAIL, password: PASSWORD } });
  expect(registered.ok(), 'register').toBeTruthy();
  const { data } = (await registered.json()) as { data: { verificationCode: string } };
  expect((await request.post(`${API}/auth/verify-email`, { data: { email: EMAIL, otp: data.verificationCode } })).ok()).toBeTruthy();

  const p = await ctx.newPage();
  await p.route('**/api/v1/payments/my-wins', (route: Route) =>
    route.fulfill({ json: { success: true, data: [PENDING, REFUNDED, LEGACY_REFUNDED] } }));
  await p.route('**/api/v1/payments/*/pay', (route: Route) => {
    sent.push(route.request().postDataJSON() as Record<string, unknown>);
    return route.fulfill({ json: { success: true, data: { transactionId: PENDING.transactionId, status: 'COMPLETED' } } });
  });
  await p.goto('/login');
  await p.getByPlaceholder('you@email.com').fill(EMAIL);
  await p.getByPlaceholder('Your password').fill(PASSWORD);
  await p.getByRole('button', { name: /sign in|log in/i }).click();
  await p.waitForURL((url) => !url.pathname.startsWith('/login'));
  return p;
}

/** Open the payment dialog for the pending sale, with the delivery details filled in. */
async function openPayment() {
  await page.goto('/buyer/my-wins');
  await page.getByRole('button', { name: 'Complete Payment' }).click();
  const dialog = page.getByRole('dialog', { name: 'Complete Payment' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Delivery Address').fill(DELIVERY.deliveryAddress);
  await dialog.getByLabel('Delivery Phone').fill(DELIVERY.deliveryPhone);
  return dialog;
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser }) => {
  page = await signedInPage(browser);
});
test.beforeEach(() => {
  sent = [];
});
test.afterAll(async () => {
  await page.context().close();
});

test.describe('Pay with', () => {
  const cases = [
    { method: 'CARD', label: 'Debit / credit card', fill: { 'Card number': '4242424242424242' }, button: 'Pay PKR 30,000 with Debit / credit card', field: { cardNumber: '4242424242424242' } },
    { method: 'JAZZCASH', label: 'JazzCash', fill: { 'JazzCash mobile number': '+92 300-1234567' }, button: 'Pay PKR 30,000 with JazzCash', field: { walletNumber: '03001234567' } },
    { method: 'EASYPAISA', label: 'Easypaisa', fill: { 'Easypaisa mobile number': '0345 1234567' }, button: 'Pay PKR 30,000 with Easypaisa', field: { walletNumber: '03451234567' } },
    { method: 'BANK_TRANSFER', label: 'Bank transfer', fill: { 'Transfer reference / transaction ID': 'FT2611110001' }, button: 'I have paid PKR 30,000', field: { bankReference: 'FT2611110001' } },
  ] as const;

  for (const c of cases) {
    test(`pays with ${c.label} and sends only that method's field`, async () => {
      const dialog = await openPayment();
      await expect(dialog.getByRole('button', { name: 'Choose how to pay' })).toBeDisabled();
      await dialog.getByRole('radio', { name: c.label }).check();
      for (const [label, value] of Object.entries(c.fill)) await dialog.getByLabel(label).fill(value);
      await dialog.getByRole('button', { name: c.button }).click();
      await expect(dialog).toBeHidden();
      expect(sent).toEqual([{ method: c.method, ...DELIVERY, ...c.field }]);
    });
  }

  test('the card fields do not invite the browser to fill in a real saved card', async () => {
    const dialog = await openPayment();
    await dialog.getByRole('radio', { name: 'Debit / credit card' }).check();
    // The gateway is simulated: a real card must not be offered by autofill, nor saved afterwards.
    for (const label of ['Card number', 'Expiry date', 'CVC']) {
      await expect(dialog.getByLabel(label)).toHaveAttribute('autocomplete', 'off');
    }
  });

  test('nothing is pre-filled into the wallet number', async () => {
    const dialog = await openPayment();
    await dialog.getByRole('radio', { name: 'JazzCash' }).check();
    await expect(dialog.getByLabel('JazzCash mobile number')).toHaveValue('');
  });

  test('a card typed before switching to JazzCash is not sent', async () => {
    const dialog = await openPayment();
    await dialog.getByRole('radio', { name: 'Debit / credit card' }).check();
    await dialog.getByLabel('Card number').fill('4242424242424242');
    await expect(dialog.getByLabel('Card number')).toHaveValue('4242 4242 4242 4242');
    await dialog.getByRole('radio', { name: 'JazzCash' }).check();
    await dialog.getByLabel('JazzCash mobile number').fill('03001234567');
    await dialog.getByRole('button', { name: 'Pay PKR 30,000 with JazzCash' }).click();
    await expect(dialog).toBeHidden();
    expect(sent).toHaveLength(1);
    expect(sent[0]).not.toHaveProperty('cardNumber');
  });

  test('a bad wallet number and a bad bank reference show an error and send nothing', async () => {
    const dialog = await openPayment();
    await dialog.getByRole('radio', { name: 'Easypaisa' }).check();
    await dialog.getByLabel('Easypaisa mobile number').fill('1234');
    await dialog.getByRole('button', { name: 'Pay PKR 30,000 with Easypaisa' }).click();
    await expect(dialog.getByRole('alert')).toContainText('Easypaisa mobile number');

    await dialog.getByRole('radio', { name: 'Bank transfer' }).check();
    await dialog.getByLabel('Transfer reference / transaction ID').fill('ab');
    await dialog.getByRole('button', { name: 'I have paid PKR 30,000' }).click();
    await expect(dialog.getByRole('alert')).toContainText('transfer reference');
    expect(sent).toHaveLength(0);
  });

  test('the method can be chosen with the arrow keys', async () => {
    const dialog = await openPayment();
    await expect(dialog.getByRole('radiogroup', { name: 'Pay with' })).toBeVisible();
    await dialog.getByRole('radio', { name: 'Debit / credit card' }).check();
    await page.keyboard.press('ArrowDown');
    await expect(dialog.getByRole('radio', { name: 'JazzCash' })).toBeChecked();
    await expect(dialog.getByLabel('JazzCash mobile number')).toBeVisible();
  });

  test('the dialog has no unnamed control and fits a 390 px screen', async () => {
    await page.setViewportSize({ width: 390, height: 800 });
    try {
      const dialog = await openPayment();
      await dialog.getByRole('radio', { name: 'Bank transfer' }).check();
      const unnamed = await dialog.locator('input, button, textarea').evaluateAll((els) =>
        els.filter((el) => {
          const e = el as HTMLInputElement;
          const labelled = (e.labels?.length ?? 0) > 0 || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby');
          return !labelled && !(e.textContent ?? '').trim();
        }).map((el) => el.outerHTML.slice(0, 80)));
      expect(unnamed).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
      const dialogOverflow = await dialog.evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(dialogOverflow).toBe(false);
    } finally {
      await page.setViewportSize({ width: 1280, height: 720 });
    }
  });
});

test.describe('A refunded sale', () => {
  test('a refund made before the refund record still explains itself', async () => {
    await page.goto('/buyer/my-wins');
    await expect(page.getByText('This purchase was refunded because the item was not sent.')).toBeVisible();
  });

  test('My Wins shows every refund detail', async () => {
    await page.goto('/buyer/my-wins');
    const card = page.locator('div').filter({ hasText: 'Kindle Paperwhite' }).filter({ hasText: 'Refund details' }).last();
    for (const label of ['Amount', 'Back to', 'Why', 'Note', 'Decided by', 'Date', 'Refund ref', 'Payment ref', 'Expected']) {
      await expect(card.getByText(label, { exact: true })).toBeVisible();
    }
    for (const value of ['JazzCash 0300•••567', 'The seller could not send the item', 'Item broke in storage', 'The seller', 'RFD-abcdefghijkl', 'PAY-abc123def456', 'Immediately (simulated: no real money moves)']) {
      await expect(card.getByText(value, { exact: true })).toBeVisible();
    }
  });
});
