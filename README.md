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
| State | React Context — five providers, no external state library |
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
    auth/       4 screens
    buyer/      7 screens
    seller/     6 screens
    admin/      7 screens
  components/
    ui/         shared primitives, layouts, navbars, modals
    ProtectedRoute.tsx, ToastContainer.tsx
  context/      Auth, Auction, Listing, Notification, Toast
  services/     api.ts (fetch wrapper), socket.ts
  hooks/        useDialog, useTimer, usePendingListings
  config/       categoryFields.ts, otp.ts
  utils/        format.ts — currency, dates, counts
  types/        shared TypeScript types
```

Two conventions worth knowing before editing:

- **Format through `utils/format.ts`.** Currency, dates and counts all have a
  helper there and the locale is pinned to `en-PK`. Inline
  `toLocaleString` calls drift apart; there used to be four different
  currency formatters.
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

`.env.local`:

```
VITE_API_URL=http://localhost:4000
```

## Scripts

| | |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | `tsc -b && vite build` — this is the typecheck too |
| `npm run lint` | ESLint |
| `npm run preview` | serve the production build |
| `npm run test:e2e` | Playwright (needs a running backend) |
| `npm run test:visual` | visual snapshots |

Verify changes with `npm run build` and `npm run lint`. A bare
`tsc --noEmit` passes even when things are broken, because the root
`tsconfig.json` is references-only.

CI runs lint and build on every push.
