import { test as setup, expect } from '@playwright/test';

const EMAIL    = process.env.TEST_SELLER_EMAIL    ?? '';
const PASSWORD = process.env.TEST_SELLER_PASSWORD ?? '';

setup('authenticate as seller', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder(/email/i).fill(EMAIL);
  await page.getByPlaceholder(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/seller\/dashboard/);
  await page.context().storageState({ path: 'e2e/.auth/seller.json' });
});
