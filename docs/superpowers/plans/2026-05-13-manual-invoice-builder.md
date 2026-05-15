# Manual Invoice Builder — Phase 6 Plan

**Goal:** Build the `/invoices/new` page — billing profile selector, trip rows with live math, totals, and save to Supabase.

**Architecture:**
- `new/page.js` = Server Component — fetches billing profiles, trucks, rate rules upfront, passes as props
- `NewInvoiceForm.js` = Client Component — owns all state, live calculations, trip management
- `TripRow.js` = Client Component — single trip row with all fields
- `new/actions.js` = Server Action — inserts invoice + trips transactionally

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/(dashboard)/invoices/new/page.js` | Modify | Server Component: fetch data, render form |
| `src/app/(dashboard)/invoices/new/actions.js` | Create | `saveInvoice(invoiceData, trips)` server action |
| `src/components/forms/TripRow.js` | Create | Single trip row — all fields, amount auto-calc |
| `src/components/forms/NewInvoiceForm.js` | Create | Main Client Component — full form, state, totals |

---

## Task 1 — Server Action (`new/actions.js`)

`saveInvoice(invoiceData, trips)`:
1. Insert one `invoices` row — capture the returned `id`
2. Insert all `trips` rows with `invoice_id`
3. If trips insert fails → delete the invoice row (cleanup), return `{ error }`
4. Return `{ invoiceId }` on success

---

## Task 2 — TripRow component (`components/forms/TripRow.js`)

One row in the trip table. Props: `trip`, `onChange`, `onRemove`, `trucks`, `rateRules` (pre-filtered by billing profile).

Fields:
- RIG invoice # (text)
- Order #s (text, comma-separated)
- Trip date start / end (date inputs)
- Truck (dropdown — active trucks)
- Rate rule (dropdown — active rate rules for selected billing profile)
  - On select → auto-fills crew type + driver names (read-only display)
- Pickup city / Delivery city (text)
- Total KM (number, optional)
- Total miles (number, required)
- Amount (read-only, auto-calculated via `calculateTripAmount`)
- Border fee toggle → reveals border fee amount + note fields

---

## Task 3 — NewInvoiceForm (`components/forms/NewInvoiceForm.js`)

Client Component. Receives `billingProfiles`, `trucks`, `allRateRules` as props.

State managed here:
- `selectedProfileId` — drives filtered rate rules + GST rate
- `invoiceDate`, `periodStart`, `periodEnd`, `invoiceNumber`, `dueDate`, `notes`
- `trips` array — each trip is an object with all TripRow fields + calculated `amount`

Behavior:
- On profile select: set GST rate from profile, re-filter rate rules, generate next invoice number (fetch from Supabase client-side), auto-calc period from today
- On any trip field change: recalculate that trip's `amount` via `calculateTripAmount`
- Add trip button: appends a blank trip row
- Remove trip: filters out by index
- Totals (live, bottom of form):
  - Subtotal = sum of all trip amounts + border fees
  - GST = subtotal × profile's `default_gst_rate`
  - NET Payable = subtotal + GST
- "Save as Draft" / "Save & View Invoice" buttons → call `saveInvoice`, redirect to `/invoices/[id]`

---

## Task 4 — Page (`new/page.js`)

Server Component. Fetches in parallel:
- `billing_profiles` (active only, ordered by label)
- `trucks` (active only, ordered by unit_number)
- `rate_rules` (active only, all profiles — form will filter client-side by selected profile)

Renders `<NewInvoiceForm>` with that data as props.

---

## Build Order

1. `actions.js` — no UI deps, pure Supabase logic
2. `TripRow.js` — pure component, no external state
3. `NewInvoiceForm.js` — composes TripRow + UI components
4. `new/page.js` — thin wrapper, just fetches + renders

---

## Done When

- [ ] Can select a billing profile → invoice # auto-generates (e.g. `R90-2026-001`)
- [ ] Period auto-sets from today's date
- [ ] Can add multiple trip rows, each with different rate rules
- [ ] Changing miles → amount updates instantly
- [ ] Math: 1,500 miles × $0.52 = $780.00, GST = $39.00, NET = $819.00
- [ ] "Save as Draft" → row appears in Supabase `invoices` + `trips` tables
- [ ] Redirect to `/invoices/[id]` after save (stub page, just shows the ID for now)
