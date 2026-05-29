import { test as setup, expect } from '@playwright/test';

const EMAIL    = process.env.TEST_ADMIN_EMAIL    ?? '';
const PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? '';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder(/email/i).fill(EMAIL);
  await page.getByPlaceholder(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await expect(page).toHaveURL(/admin\/dashboard/);
  await page.context().storageState({ path: 'e2e/.auth/admin.json' });
});
