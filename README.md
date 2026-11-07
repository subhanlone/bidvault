[![CI](https://github.com/subhanlone/bidvault/actions/workflows/ci.yml/badge.svg)](https://github.com/subhanlone/bidvault/actions/workflows/ci.yml)

# BidVault Frontend

Auction platform UI. React 19 + TypeScript + Vite, routed with React Router 7
and styled with Tailwind CSS v4. Talks to
[bidvault-backend](https://github.com/subhanlone/bidvault-backend); deployed on
Vercel.

## Stack

| | |
| --- | --- |
| Framework | React 19.2, TypeScript ~6.0 |
| Build | Vite 8 (`@vitejs/plugin-react`) |
| Routing | React Router 7.15 — every route is lazy-loaded behind `<Suspense>` |
| Styling | Tailwind CSS v4.3 via `@tailwindcss/vite` |
| State | TanStack Query for everything the server owns; React Context only for the signed-in user, the listing draft and toasts |
| Realtime | `socket.io-client` |
| Payments | self-built dummy gateway — no external processor |
| Icons | `lucide-react` |
| Lint | ESLint 10 + typescript-eslint |
| E2E | Playwright |

### Tailwind v4 — there is no config file

v4 configures itself from CSS. The design tokens live in the `@theme` block at
the top of `src/index.css`; that block is the single source of truth for
colour. Adding a token there is what makes `bg-<name>` exist. Do not go looking
for `tailwind.config.js` — creating one would not be picked up.

## Layout

```
src/
  screens/      LandingPage, Privacy, Terms, NotFound, Maintenance, TransactionInvoice
    public/     browse and the auction page (open to everyone)
    auth/       sign in, register, verify e-mail, forgot password
    buyer/      my bids, my wins, watchlist, profile, the result of an auction
    seller/     dashboard, My Items, the listing wizard, become a seller, profile
    admin/      dashboard, listing review, live auctions, users, transactions, settings
  components/
    ui/         shared primitives, layouts, navbars, modals
    auction/    the pieces of the auction page (bid panel, bid list, seller card, result)
    seller/     the pieces of My Items
    ProtectedRoute.tsx, ToastContainer.tsx
  context/      Auth, Listing (the draft), Toast
  queries/      TanStack Query hooks and keys, plus RealtimeBridge (socket events into the cache)
  services/     api.ts (typed fetch wrapper), socket.ts
  hooks/        shared hooks (useDialog, useTimer, useSignInLink, ...)
  config/       categories.ts, categoryFields.ts, otp.ts
  utils/        format.ts (currency, dates, counts), account.ts, validation.ts, ...
  types/        api.ts (generated API types, re-exported) and app-only types
```

Two conventions worth knowing before editing:

- **Format through `utils/format.ts`.** Currency, dates and counts all have a
  helper there and the locale is pinned to `en-PK`. Inline
  `toLocaleString` calls drift apart.
- **Dialogs use `useDialog`.** It handles Escape, the focus trap, focus
  restore and the scroll lock. A modal that rolls its own will get these
  wrong.

`config/categoryFields.ts` mirrors the backend's per-category listing
attribute schema. The two have to agree — change one and you must change the
other.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

`.env.local` needs `VITE_API_URL`, the API base URL including `/api/v1`.
`.env.example` says why the API has to be on the same site as the page.

## Scripts

| | |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | `tsc -b && vite build` — this is the typecheck too |
| `npm run lint` | ESLint |
| `npm run preview` | serve the production build |
| `npm run audit:gate` | fails on any npm advisory that is not in `audit-allowlist.json` |
| `npm run test:e2e` | Playwright (needs a running backend); `:ui` opens the runner |
| `npm run test:visual` | visual snapshots; `:update` rewrites them |

Verify changes with `npm run build` and `npm run lint`. A bare
`tsc --noEmit` passes even when things are broken, because the root
`tsconfig.json` is references-only.

CI runs lint and build on every push.
