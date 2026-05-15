# Route90 Invoicer

Invoicing tool for Route90 Trucking Inc. Generates professional invoices for transportation services billed to clients like Rig Logistics.

**Status: IN PROGRESS — Phases 0–5 of 12 complete.**

---

## Stack

- Next.js 14 · App Router · JavaScript (no TypeScript)
- Tailwind CSS
- Supabase: Auth + Postgres + Storage
- Anthropic API (server-side only, Phase 8+)
- @react-pdf/renderer (Phase 7+)
- Deployed on Vercel

## How to Run (Fedora / Linux)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — redirects to `/login`.

**Node:** v20+ required (v22 works). Do not use Windows node_modules on Linux — they contain `@next/swc-win32-x64-msvc`. Always run `npm install` fresh on each OS.

## Running Tests

```bash
npm test
```

33 tests covering all `invoiceMath.js` functions. All must pass before any invoice UI work.

## Environment Variables

Copy `.env.local` and fill in real values:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` are server-only — never prefix with `NEXT_PUBLIC_`.

## Database Setup

1. Run `supabase/migrations/20260511000001_initial_schema.sql` in Supabase SQL Editor
2. Run `supabase/seed.sql` to insert the billing profile, 4 drivers, 2 trucks, and 4 rate rules

## Build Guide

The full 12-phase build guide lives at:
`../route90-invoicer-guide-v3.md` (one level up, in the Projects/ folder)

---

## Current State — What's Done vs What's Left

### Phases Complete

| Phase | What | Status |
|-------|------|--------|
| 0 | Project scaffold — Next.js 14, folder structure, env, CLAUDE.md | ✅ Done |
| 1 | Auth system — login page, middleware, sidebar, topbar, sign-out | ✅ Done |
| 2 | Database schema — 6 tables, migration SQL, seed data | ✅ Done |
| 3 | Invoice math — all 7 utility functions, 33 Jest tests passing | ✅ Done |
| 4 | UI component library — Button, Card, Badge, Modal, DataTable, etc. | ✅ Done |
| 5 | Settings pages — all 4 tabs (Billing Profiles, Drivers, Trucks, Rate Rules) | ✅ Done |

### Phases Remaining (all stubs — 3 lines each)

| Phase | What | File |
|-------|------|------|
| 6 | Manual invoice builder — trip form, live math, save to Supabase | `invoices/new/page.js` |
| 7 | Invoice view page + PDF export | `invoices/[id]/page.js`, `utils/pdfTemplate.js` |
| 8 | AI route handlers — trip sheet scanner, mileage estimator APIs | `app/api/` (doesn't exist yet) |
| 9 | AI scan page — upload photo, AI fills trips | `invoices/scan/page.js` |
| 10 | Dashboard — invoice list, summary cards, filter tabs | `dashboard/page.js` |
| 11 | Invoice edit page | `invoices/[id]/edit/page.js` |
| 12 | Security review, cleanup, E2E test, production deploy | — |

**Progress: ~42% complete (5 of 12 phases done)**

---

## File Structure

```
src/
  app/
    (auth)/login/page.js          — Login form (complete)
    (dashboard)/
      layout.js                   — Protected shell: Sidebar + TopBar (complete)
      dashboard/page.js           — STUB
      invoices/new/page.js        — STUB
      invoices/scan/page.js       — STUB
      invoices/[id]/page.js       — STUB
      invoices/[id]/edit/page.js  — STUB
      settings/page.js            — Complete (fetches all 4 tables)
    actions/
      auth.js                     — signOut server action
      settings.js                 — Full CRUD for all 4 settings tables
  components/
    Sidebar.js                    — Dark sidebar with nav + sign-out
    TopBar.js                     — White topbar with search + avatar
    ui/                           — Button, Card, Badge, Modal, DataTable,
                                    EmptyState, FormField, PageHeader, Toast,
                                    ToggleSwitch (all complete)
    settings/                     — BillingProfilesTab, DriversTab, TrucksTab,
                                    RateRulesTab + modals (all complete)
  lib/
    supabase/client.js            — Browser Supabase client
    supabase/server.js            — Server Supabase client
    supabase/middleware.js        — updateSession helper
    anthropic.js                  — Anthropic SDK instance (server-only)
  middleware.js                   — Route protection (complete)
  utils/
    invoiceMath.js                — All 7 math functions (complete + tested)
    pdfTemplate.js                — STUB (Phase 7)
    mileageEstimator.js           — Placeholder (Phase 8)
supabase/
  migrations/20260511000001_initial_schema.sql  — 6 tables (complete)
  seed.sql                                       — Dev seed data (complete)
```

---

## Design System

Light mode only (dark mode planned for later).

- Font: `-apple-system, BlinkMacSystemFont, "SF Pro Display"` (Apple system font stack)
- Primary: `#4F46E5` (Indigo)
- Page background: `#F2F2F7`
- Cards: white, `border-radius: 14px`, `border: 0.5px solid rgba(0,0,0,0.06)`
- Sidebar: `#0D1117` (dark)
- Text primary: `#1D1D1F` / secondary: `#6E6E73` / muted: `#AEAEB2`

Note: This project uses a **light mode Apple/SaaS design** — NOT the iOS Glass Dark system used in other projects (SplitHouse, etc.).

---

## Known Issues

- `pdfTemplate.js` is a stub — `generateInvoicePDF()` is not implemented
- No `app/api/` folder — AI route handlers don't exist yet
- Git history has a read error on one parent commit (may be from Windows→Linux transfer)
- Node.js on this machine is v22 (guide specifies v20 — works fine with Next.js 14)

## Fedora Migration Notes (2026-05-13)

Migrated from Windows. Steps taken:
1. Deleted `node_modules/` — contained `@next/swc-win32-x64-msvc` (Windows-only native binary)
2. Deleted `.next/` build cache
3. Deleted `coverage/` test artifacts
4. Ran `npm install` fresh — now has `@next/swc-linux-x64-gnu` and `@next/swc-linux-x64-musl`
5. Confirmed dev server starts and `/login` returns 200
6. Confirmed all 33 Jest tests pass
