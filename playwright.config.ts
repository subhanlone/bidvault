import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

const BASE_URL = process.env.BASE_URL ?? 'https://bidvault.vercel.app';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    // Auth setup runs first, saves storage state for each role
    { name: 'setup-buyer',  testMatch: '**/setup/buyer.setup.ts' },
    { name: 'setup-admin',  testMatch: '**/setup/admin.setup.ts' },
    { name: 'setup-seller', testMatch: '**/setup/seller.setup.ts' },

    // Tests run after setup
    {
      name: 'public',
      testMatch: ['**/landing.spec.ts', '**/auth.spec.ts'],
    },
    {
      name: 'buyer',
      testMatch: '**/buyer.spec.ts',
      dependencies: ['setup-buyer'],
      use: { storageState: 'e2e/.auth/buyer.json' },
    },
    {
      name: 'admin',
      testMatch: '**/admin.spec.ts',
      dependencies: ['setup-admin'],
      use: { storageState: 'e2e/.auth/admin.json' },
    },
    {
      name: 'seller',
      testMatch: '**/seller.spec.ts',
      dependencies: ['setup-seller'],
      use: { storageState: 'e2e/.auth/seller.json' },
    },
    {
      name: 'visual',
      testMatch: '**/visual.spec.ts',
      dependencies: ['setup-buyer', 'setup-admin'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
