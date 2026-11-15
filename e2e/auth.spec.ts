import { test, expect, type Page } from '@playwright/test';

const BUYER_EMAIL    = process.env.TEST_BUYER_EMAIL    ?? '';
const BUYER_PASSWORD = process.env.TEST_BUYER_PASSWORD ?? '';

test.describe('Auth — Login', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /sign in|log in|welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder('you@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('Your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('shows inline error on wrong credentials', async ({ page }) => {
    await page.goto('/login');
    // A throwaway address, deliberately not BUYER_EMAIL: the test only asserts that the inline
    // error renders, and failing logins against a real account would trip the lockout and lock out
    // the account the rest of the suite signs in with.
    await page.getByPlaceholder('you@email.com').fill('no-such-account@bidvault.invalid');
    await page.getByPlaceholder('Your password').fill('WrongPassword999!');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    // Inline field error rendered by Input as role="alert", stays until user retypes
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/login/);
  });

  test('buyer logs in and lands on browse page', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@email.com').fill(BUYER_EMAIL);
    await page.getByPlaceholder('Your password').fill(BUYER_PASSWORD);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/browse$/, { timeout: 10000 });
  });

  test('link to register page works', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Create one free' }).click();
    await expect(page).toHaveURL(/register/);
  });

  test('forgot password link navigates correctly', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /forgot/i }).click();
    await expect(page).toHaveURL(/forgot-password/);
  });
});

test.describe('Auth — Register page', () => {
  test('register page renders all fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByPlaceholder('Your full name')).toBeVisible();
    await expect(page.getByPlaceholder('you@email.com')).toBeVisible();
    await expect(page.getByPlaceholder('Min. 8 characters')).toBeVisible();
    await expect(page.getByRole('button', { name: /register|create|sign up/i })).toBeVisible();
  });

  test('shows validation error on empty submit', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /register|create|sign up/i }).click();
    await expect(page.getByText(/required|fill|enter/i).first()).toBeVisible();
  });
});

// The confirm field is checked in the browser only: these never reach the server, so they need no
// backend. A mismatch or an empty confirmation must stop the request itself, not just show an error.
test.describe('Auth — Register confirm password', () => {
  async function fillRegister(page: Page, pw: string, confirm?: string) {
    await page.goto('/register');
    await page.getByPlaceholder('Your full name').fill('Confirm Probe');
    await page.getByPlaceholder('you@email.com').fill(`confirm-${Date.now()}@test.local`);
    await page.getByPlaceholder('Min. 8 characters').fill(pw);
    if (confirm !== undefined) await page.getByPlaceholder('Repeat password').fill(confirm);
    await page.locator('label[for="terms-agree"]').click();
  }

  function watchRegister(page: Page) {
    const sent: string[] = [];
    page.on('request', (r) => { if (r.url().endsWith('/auth/register')) sent.push(r.url()); });
    return sent;
  }

  test('confirm field is shown with new-password autocomplete', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel('Confirm password')).toBeVisible();
    await expect(page.getByPlaceholder('Repeat password')).toHaveAttribute('autocomplete', 'new-password');
    await expect(page.getByPlaceholder('Min. 8 characters')).toHaveAttribute('autocomplete', 'new-password');
  });

  test('a mismatched confirm password shows an error and sends nothing', async ({ page }) => {
    const sent = watchRegister(page);
    await fillRegister(page, 'Abcdef1!x', 'Abcdef1!y');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/register/);
    expect(sent).toHaveLength(0);
  });

  test('fixing the confirm password clears the error', async ({ page }) => {
    await fillRegister(page, 'Abcdef1!x', 'Abcdef1!y');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
    await page.getByPlaceholder('Repeat password').fill('Abcdef1!x');
    await expect(page.getByText('Passwords do not match')).toHaveCount(0);
  });

  test('an empty confirm password is refused on submit', async ({ page }) => {
    const sent = watchRegister(page);
    await fillRegister(page, 'Abcdef1!x');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Please confirm your password')).toBeVisible();
    expect(sent).toHaveLength(0);
  });

  test('changing the password re-checks the confirm field', async ({ page }) => {
    await fillRegister(page, 'Abcdef1!x', 'Abcdef1!x');
    await expect(page.getByText('Passwords do not match')).toHaveCount(0);
    await page.getByPlaceholder('Min. 8 characters').fill('Abcdef1!z');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('a trailing space counts as a mismatch and blocks submit', async ({ page }) => {
    const sent = watchRegister(page);
    await fillRegister(page, 'Abcdef1!x', 'Abcdef1!x ');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/\/register/);
    expect(sent).toHaveLength(0);
  });

  test('typing the confirmation before the password shows no mismatch yet', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('Repeat password').fill('Abcdef1!x');
    // Nothing to compare against yet, as on the reset page.
    await expect(page.getByText('Passwords do not match')).toHaveCount(0);
    // Once a different password is typed, the mismatch appears.
    await page.getByPlaceholder('Min. 8 characters').fill('Abcdef1!z');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('confirm toggle does not reveal the password field', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Show confirmed password' }).click();
    await expect(page.getByPlaceholder('Repeat password')).toHaveAttribute('type', 'text');
    await expect(page.getByPlaceholder('Min. 8 characters')).toHaveAttribute('type', 'password');
  });

  test('password toggle does not reveal the confirm field', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Show password', exact: true }).click();
    await expect(page.getByPlaceholder('Min. 8 characters')).toHaveAttribute('type', 'text');
    await expect(page.getByPlaceholder('Repeat password')).toHaveAttribute('type', 'password');
  });
});

test.describe('Auth — Forgot Password', () => {
  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send|reset|submit/i })).toBeVisible();
  });
});
