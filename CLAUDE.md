# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is
Multi-user web invoicing app for Route90 Trucking. Two invoice creation modes: manual entry, or AI scan of handwritten trip sheets. Built to potentially go public — not a single-user internal tool.

## Stack
- Next.js 14 App Router, JavaScript (no TypeScript)
- Tailwind CSS
- Supabase: Auth + Postgres DB + Storage
- Anthropic API (server-side only — never in client components)
- `@react-pdf/renderer` for PDF export
- Deployed on Vercel

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
npm test             # Jest (all tests)
npm test -- --testPathPattern=invoiceMath   # run a single test file
npm run test:coverage
```

Tests live in `src/utils/__tests__/`. Jest is configured with `testEnvironment: 'node'` (not jsdom).

## Architecture Rules — Never Violate

- **ALL Anthropic API calls** go exclusively through Route Handlers in `src/app/api/`. Never import `@anthropic-ai/sdk` in `app/(dashboard)/` or `components/`.
- **Two Supabase clients** — use the right one per context:
  - Browser (Client Components): `src/lib/supabase/client.js`
  - Server (Server Components, Server Actions, Route Handlers): `src/lib/supabase/server.js`
- **Auth is dual-layer:** `src/middleware.js` redirects unauthenticated requests via `updateSession` (edge), and `src/app/(dashboard)/layout.js` does a second `getUser()` check on the server before rendering any dashboard page.
- **RLS is intentionally DISABLED** on all tables — auth is enforced at the app layer. Do not enable RLS.
- No TypeScript — plain JavaScript throughout.
- Always use `.maybeSingle()` not `.single()` for membership queries.

## Data Flow: Two Invoice Creation Paths

**Manual path:** `invoices/new/page.js` → `NewInvoiceForm.js` (client) → `TripRow.js` per line item → `saveInvoice` server action (`invoices/new/actions.js`)

**AI scan path:** `invoices/scan/page.js` → `ScanInvoiceForm.js` (client) → `ImageUploadZone.js` sends base64 image to `POST /api/scan` → `claude-sonnet-4-6` vision → extracted trips returned as JSON → user reviews/edits in `ScanInvoiceForm` → `saveInvoice` server action

Both paths converge at `saveInvoice`, which inserts the `invoices` row then bulk-inserts all `trips` rows. If trips insert fails, the invoice row is rolled back manually.

## Invoice Edit Flow

`updateInvoice` (in `src/app/actions/invoices.js`) uses **delete-and-reinsert** for trips — it never patches individual trip rows. It deletes all existing trips for the invoice then re-inserts them. This is intentional and must be preserved.

## Mileage Estimator

`POST /api/estimate-miles` uses `claude-haiku-4-5-20251001` with `max_tokens: 20`, returns a single integer. Results are cached in a module-level `Map` (resets on cold start — acceptable). The client-side `mileageEstimator.js` utility in `src/utils/` is a stub with an empty lookup table — actual estimation always goes through the API route.

## Key Business Logic (src/utils/invoiceMath.js)

- `calculateBillingPeriod(dateString)` — day ≤ 15 → 1st–15th of month; day > 15 → 16th–last day
- `generateNextInvoiceNumber(existingNumbers, prefix, year)` — format `{prefix}-{YYYY}-{NNN}`, zero-padded to 3 digits, increments from the highest existing number in the same year
- `calculateGST(subtotal, gstRate)` — GST rate stored as `numeric(4,3)` (e.g. `0.050` = 5%)
- `formatCAD(amount)` — always use this for money display in both UI and PDF
- All money math uses `Math.round(x * 100) / 100` to avoid floating-point drift

## Snapshot Columns (Critical)

Trips store frozen values at the time of creation: `truck_number_snapshot`, `driver_names_snapshot`, `rate_per_mile_snapshot`, `gst_rate_snapshot` (on invoice). Editing trucks, drivers, or rate rules must never alter past invoices. Always read snapshot columns — never join back to `drivers`/`trucks`/`rate_rules` — when displaying or generating PDFs for saved invoices.

## DB Schema Quick Reference

```
billing_profiles  — biller + client info, invoice_prefix, default_gst_rate (numeric 4,3), default_payment_terms_days
drivers           — full_name, license_class, phone, email, is_active
trucks            — unit_number, plate_number, province, is_active
rate_rules        — billing_profile_id FK, label, crew_type (solo|team), driver_ids uuid[], driver_names_snapshot text[], rate_per_mile numeric(6,4)
invoices          — billing_profile_id FK, invoice_number (unique), status (draft|sent|paid), subtotal/gst_amount/gst_rate_snapshot/total, created_by FK auth.users
trips             — invoice_id FK cascade delete, sort_order, all snapshot cols, order_numbers text[], border_fee, border_fee_note
```

Migration: `supabase/migrations/20260511000001_initial_schema.sql` | Seed: `supabase/seed.sql`

## Status Lifecycle

`draft → sent → paid` — one-way only. `markInvoiceSent` and `markInvoicePaid` in `src/app/actions/invoices.js` enforce this.

## PDF Generation (src/utils/pdfTemplate.js)

`generateAndDownloadPDF(invoice, trips, billingProfile)` — client-side only (uses `document`). Builds a `@react-pdf/renderer` `<Document>` and triggers a browser download. Always use snapshot columns, never live data. Use `gst_rate_snapshot` from the invoice for the GST label, never the current billing profile rate.

## Design System

- Light mode only
- Font: `-apple-system, BlinkMacSystemFont` (SF Pro)
- Primary: Indigo `#4F46E5`
- Background: `#F2F2F7`
- Cards: white, `border-radius: 14px`, `border: 0.5px rgba(0,0,0,0.06)`
- UI primitives live in `src/components/ui/` — reuse them, don't create parallel implementations

## graphify

Knowledge graph at `graphify-out/`. Read `graphify-out/GRAPH_REPORT.md` before answering architecture questions. After modifying source files, run `graphify update .` (no API cost).
