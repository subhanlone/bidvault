import { test, expect } from '@playwright/test';

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
    await page.getByPlaceholder('you@email.com').fill(BUYER_EMAIL);
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
    await expect(page).toHaveURL(/buyer\/browse/, { timeout: 10000 });
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

test.describe('Auth — Forgot Password', () => {
  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send|reset|submit/i })).toBeVisible();
  });
});
