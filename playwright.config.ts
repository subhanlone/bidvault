import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

/**
 * Default to the local dev server, not a deployment.
 *
 * This previously fell back to a production hostname, and .env.test.example pointed at a
 * Vercel deployment too — and there is only one backend and one database behind any deployed
 * frontend. So `npm run test:e2e` on a fresh checkout signed three real accounts in and fired
 * a deliberate wrong-password login (auth.spec.ts) at production. Harmless while nothing
 * rate-limits, and an account lockout the moment something does.
 *
 * A deployed target is still reachable — it just has to be asked for by name.
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';

// Mirrors backend/tests/setup.ts: refuse a target that is not obviously disposable unless
// the operator says so in the command. The backend suite has had this guard since the
// shared-Redis incident; the browser suite never did.
const PRODUCTION_HOSTS = /(vercel\.app|railway\.app|bidvault\.tech)/;
if (PRODUCTION_HOSTS.test(BASE_URL) && process.env.ALLOW_PRODUCTION_E2E !== '1') {
  throw new Error(
    `Refusing to run the browser suite against "${BASE_URL}".\n\n` +
      `  These specs sign real accounts in and submit a deliberate wrong password.\n` +
      `  There is one backend and one database behind every deployed frontend.\n\n` +
      `  For local testing, leave BASE_URL unset (defaults to http://localhost:5173).\n` +
      `  If you genuinely mean to run against a deployment:\n\n` +
      `      ALLOW_PRODUCTION_E2E=1 BASE_URL=${BASE_URL} npm run test:e2e\n`,
  );
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  workers: 1,

  // Start the local dev server for a local run, and reuse one that is already up. Skipped
  // when an explicit BASE_URL points somewhere else.
  ...(BASE_URL === 'http://localhost:5173'
    ? {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }
    : {}),

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
