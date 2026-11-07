import { test, expect, type Page } from '@playwright/test';

/**
 * Browse as a list with filters (guest browsing, F2): results as list rows or grid cards, a rail of
 * filters that each show how many auctions they would give, the sort menu, and search by item
 * number. Every filter lives in the address.
 * Runs against a LOCAL backend whose *_test database holds six live "Browse Spec" auctions that
 * differ in category, condition, price and bids (see the seed in the guest browsing notes):
 *
 *   Alpha Camera  Electronics & Gadgets  New        PKR  3,000  0 bids  BV-2026-B200000001
 *   Beta Camera   Electronics & Gadgets  Used       PKR  8,000  2 bids  BV-2026-B200000002
 *   Gamma Desk    Home & Furniture       Used       PKR 30,000  4 bids  BV-2026-B200000003
 *   Delta Lamp    Home & Furniture       New        PKR 12,000  0 bids  BV-2026-B200000004
 *   Epsilon Book  Books & Education      Like new   PKR  5,000  1 bid   BV-2026-B200000005
 *   Zeta Bike     Sports & Fitness       Used       PKR 25,000  0 bids  BV-2026-B200000006
 */

const API = process.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(API)) {
  throw new Error(`guest-browse.spec.ts only runs against a local backend, not "${API}".`);
}

const BROWSE = '/browse?search=Browse%20Spec';
const TITLES = {
  alpha: 'Browse Spec Alpha Camera',
  beta: 'Browse Spec Beta Camera',
  gamma: 'Browse Spec Gamma Desk',
  delta: 'Browse Spec Delta Lamp',
  epsilon: 'Browse Spec Epsilon Book',
  zeta: 'Browse Spec Zeta Bike',
};

const rows = (page: Page) => page.getByRole('main').getByRole('article');
const rail = (page: Page) => page.getByRole('complementary', { name: 'Auction filters' });

/** The title of every result, in the order shown. */
const shownTitles = (page: Page) => rows(page).getByRole('heading').allTextContents();

/** "Used (3)" -> 3: the count a filter shows beside its name. */
async function countShownBy(page: Page, name: string): Promise<number> {
  const label = rail(page).getByLabel(new RegExp(`^${name} \\(\\d+\\)$`));
  const text = (await label.evaluate((el) => (el as HTMLInputElement).labels?.[0]?.textContent ?? '')).trim();
  return Number(/\((\d+)\)$/.exec(text)?.[1]);
}

test.describe('Results as a list', () => {
  test('are a list of rows by default and switch to a grid', async ({ page }) => {
    await page.goto(BROWSE);
    await expect(rows(page)).toHaveCount(6);

    const beta = rows(page).filter({ hasText: TITLES.beta });
    await expect(beta.getByText('PKR 8,000')).toBeVisible();
    await expect(beta.getByText(/^2 bids · /)).toBeVisible();
    await expect(beta.getByText('Located in Lahore, Punjab')).toBeVisible();
    await expect(beta.getByText('Test Seller')).toBeVisible();
    await expect(page.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
    // A row is read through its title link: no View button as on a card.
    await expect(page.getByRole('button', { name: `View ${TITLES.beta}` })).toHaveCount(0);

    await page.getByRole('button', { name: 'Grid' }).click();
    await expect(page).toHaveURL(/view=grid/);
    await expect(page.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: `View ${TITLES.beta}` })).toBeVisible();
    await expect(rows(page)).toHaveCount(6);

    await page.getByRole('button', { name: 'List' }).click();
    await expect(page).not.toHaveURL(/view=/);
    await expect(page.getByRole('button', { name: `View ${TITLES.beta}` })).toHaveCount(0);
  });

  test('say how many there are', async ({ page }) => {
    await page.goto(BROWSE);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('6 results for "Browse Spec"');
  });
});

test.describe('Filters with counts', () => {
  test('each filter shows a count that matches the result count after applying it', async ({ page }) => {
    const choices: { name: string; rows: number }[] = [
      { name: 'Home & Furniture', rows: 2 },
      { name: 'Used', rows: 3 },
      { name: 'Like new', rows: 1 },
      { name: 'Under PKR 5,000', rows: 1 },
      { name: 'PKR 5,000 to 25,000', rows: 4 },
      { name: 'Over PKR 25,000', rows: 1 },
      { name: 'Auctions with bids', rows: 3 },
    ];
    for (const choice of choices) {
      await page.goto(BROWSE);
      await expect(rows(page)).toHaveCount(6);
      const shown = await countShownBy(page, choice.name);
      expect(shown, `${choice.name} shows its count`).toBe(choice.rows);

      await rail(page).getByLabel(new RegExp(`^${choice.name} \\(`)).check();
      await expect(rows(page), `${choice.name} gives that many rows`).toHaveCount(shown);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(`${shown} result`);
    }
  });

  test('a group ignores its own filter, so another choice shows what it would give', async ({ page }) => {
    await page.goto(`${BROWSE}&category=Home%20%26%20Furniture`);
    await expect(rows(page)).toHaveCount(2);
    // The other categories still show their counts although one is chosen.
    expect(await countShownBy(page, 'Electronics & Gadgets')).toBe(2);
    // The conditions count only the chosen category.
    expect(await countShownBy(page, 'Used')).toBe(1);
  });

  test('two conditions together widen the result', async ({ page }) => {
    await page.goto(BROWSE);
    await rail(page).getByLabel(/^New \(/).check();
    await rail(page).getByLabel(/^Like new \(/).check();
    await expect(rows(page)).toHaveCount(3);
    await expect(page).toHaveURL(/condition=NEW/);
    await expect(page).toHaveURL(/condition=LIKE_NEW/);
  });

  test('a minimum and a maximum narrow the result by price', async ({ page }) => {
    await page.goto(BROWSE);
    await rail(page).getByLabel('Minimum price').fill('8000');
    await rail(page).getByLabel('Maximum price').fill('25000');
    await expect(rows(page)).toHaveCount(3);
    expect(await shownTitles(page)).toEqual(expect.arrayContaining([TITLES.beta, TITLES.delta, TITLES.zeta]));
  });

  test('a minimum above the maximum shows an inline message and sends no request', async ({ page }) => {
    await page.goto(BROWSE);
    await expect(rows(page)).toHaveCount(6);
    const listCalls: string[] = [];
    page.on('request', (r) => {
      if (/\/auctions(\/facets)?\?/.test(r.url())) listCalls.push(r.url());
    });
    await rail(page).getByLabel('Minimum price').fill('9000');
    await rail(page).getByLabel('Maximum price').fill('1000');
    await expect(rail(page).getByText('The lowest price cannot be above the highest price.')).toBeVisible();
    await page.waitForTimeout(900); // past the debounce
    expect(listCalls.filter((u) => /minPrice=9000/.test(u)), 'no request carries the impossible range').toEqual([]);
    await expect(rows(page)).toHaveCount(6);
  });

  test('Clear all puts everything back', async ({ page }) => {
    await page.goto(`${BROWSE}&condition=USED&withBids=true`);
    await expect(rows(page)).toHaveCount(2);
    await rail(page).getByRole('button', { name: 'Clear all' }).click();
    await expect(rows(page)).toHaveCount(6);
    // Clearing the filters keeps the words that were searched.
    await expect(page.getByLabel('Search auctions')).toHaveValue('Browse Spec');
  });

  test('the address holds the filters: a reload keeps them and Back undoes one', async ({ page }) => {
    await page.goto(BROWSE);
    await rail(page).getByLabel(/^Used \(/).check();
    await expect(rows(page)).toHaveCount(3);
    await page.reload();
    await expect(rail(page).getByLabel(/^Used \(/)).toBeChecked();
    await expect(rows(page)).toHaveCount(3);
    await page.goBack();
    await expect(rows(page)).toHaveCount(6);
    await expect(rail(page).getByLabel(/^Used \(/)).not.toBeChecked();
  });
});

test.describe('Sort', () => {
  test('offers the seven sorts and the order changes', async ({ page }) => {
    await page.goto(BROWSE);
    const sort = page.getByLabel('Sort');
    await expect(sort.getByRole('option')).toHaveText([
      'Time: ending soonest',
      'Time: ending soonest, with bids',
      'Time: newly listed',
      'Price: lowest first',
      'Price: highest first',
      'Number of bids: most first',
      'Number of bids: fewest first',
    ]);

    await sort.selectOption({ label: 'Price: lowest first' });
    await expect(page).toHaveURL(/sort=price-asc/);
    await expect.poll(() => shownTitles(page)).toEqual([
      TITLES.alpha, TITLES.epsilon, TITLES.beta, TITLES.delta, TITLES.zeta, TITLES.gamma,
    ]);

    await sort.selectOption({ label: 'Price: highest first' });
    await expect.poll(() => shownTitles(page)).toEqual([
      TITLES.gamma, TITLES.zeta, TITLES.delta, TITLES.beta, TITLES.epsilon, TITLES.alpha,
    ]);

    await sort.selectOption({ label: 'Number of bids: most first' });
    await expect.poll(async () => (await shownTitles(page)).slice(0, 3)).toEqual([TITLES.gamma, TITLES.beta, TITLES.epsilon]);

    await sort.selectOption({ label: 'Time: ending soonest, with bids' });
    await expect.poll(() => shownTitles(page)).toEqual([TITLES.beta, TITLES.gamma, TITLES.epsilon]);

    await sort.selectOption({ label: 'Time: ending soonest' });
    await expect(page).not.toHaveURL(/sort=/);
    await expect.poll(async () => (await shownTitles(page))[0]).toBe(TITLES.beta);
  });
});

test.describe('Search', () => {
  test('finds an auction by its item number, typed in lower case, and only that one', async ({ page }) => {
    await page.goto('/browse');
    await page.getByLabel('Search auctions').fill('bv-2026-b200000003');
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).getByRole('heading')).toHaveText(TITLES.gamma);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('1 result');
  });

  test('says in its placeholder that an item number works', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.getByLabel('Search auctions')).toHaveAttribute('placeholder', 'Search by name, or by item number');
  });

  test('words typed in the box are kept in the address', async ({ page }) => {
    await page.goto('/browse');
    await page.getByLabel('Search auctions').fill('Browse Spec Camera');
    await expect(rows(page)).toHaveCount(2);
    await expect(page).toHaveURL(/search=Browse\+Spec\+Camera|search=Browse%20Spec%20Camera/);
  });

  test('a search with no match says so and offers to clear the filters', async ({ page }) => {
    await page.goto(`${BROWSE}&condition=LIKE_NEW&withBids=true&minPrice=20000`);
    await expect(page.getByText('No auctions found')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(rows(page)).toHaveCount(6);
  });
});

test.describe('On a phone', () => {
  test('the filters open from a button, show the same counts and the page does not scroll sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BROWSE);
    await expect(rows(page)).toHaveCount(6);
    await expect(rail(page)).toBeHidden();
    await page.getByRole('button', { name: 'Filters' }).click();
    const panel = page.getByRole('region', { name: 'Auction filters' });
    await expect(panel.getByLabel(/^Used \(3\)$/)).toBeVisible();
    await panel.getByLabel(/^Used \(/).check();
    await expect(rows(page)).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), 'no sideways scroll').toBe(false);
  });
});

test.describe('Home', () => {
  test('category tiles show how many live auctions each has', async ({ page }) => {
    await page.goto('/');
    const tiles = page.getByRole('region', { name: 'Shop by category' });
    await expect(tiles.getByRole('link', { name: /^Home & Furniture/ })).toContainText('2 live');
    await expect(tiles.getByRole('link', { name: /^Books & Education/ })).toContainText('1 live');
    await expect(tiles.getByRole('link', { name: /^Vehicles/ })).toContainText('0 live');
  });

  test('the search box says an item number works', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Search auctions')).toHaveAttribute('placeholder', 'Search by name, or by item number');
  });
});
