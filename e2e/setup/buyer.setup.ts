import { test as setup, expect } from '@playwright/test';

const EMAIL    = process.env.TEST_BUYER_EMAIL    ?? '';
const PASSWORD = process.env.TEST_BUYER_PASSWORD ?? '';

setup('authenticate as buyer', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder(/email/i).fill(EMAIL);
  await page.getByPlaceholder(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/buyer\/browse/);
  await page.context().storageState({ path: 'e2e/.auth/buyer.json' });
});
