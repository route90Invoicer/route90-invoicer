# Route90 Invoicer — End-to-End Test Checklist

Run through these on the live Vercel URL after every deploy.

---

## 1. Auth

- [ ] Visit `/dashboard` with no session → redirected to `/login`
- [ ] Login with wrong password → error message shown, no redirect
- [ ] Login with correct credentials → lands on `/dashboard`
- [ ] Sign out from sidebar → redirected to `/login`, `/dashboard` no longer accessible

---

## 2. Dashboard — Empty State

- [ ] On a fresh account with no invoices → EmptyState card shows ("No invoices yet")
- [ ] "New Invoice" button → navigates to `/invoices/new`
- [ ] "Scan Trip Sheet" button → navigates to `/invoices/scan`

---

## 3. Settings — Billing Profiles

- [ ] Navigate to Settings → Billing Profiles tab
- [ ] Click "Add Profile" → modal opens
- [ ] Fill all fields (label, biller name, client name, invoice prefix e.g. "TEST", GST rate 5%)
- [ ] Save → new profile appears in list
- [ ] Click edit → modal pre-populates all fields
- [ ] Change label → save → list updates
- [ ] Toggle active/inactive → row reflects change

---

## 4. Settings — Drivers

- [ ] Navigate to Drivers tab
- [ ] Add a new driver (name, license class)
- [ ] Driver appears in list
- [ ] Edit driver → change name → verify update persists
- [ ] Deactivate driver → row shows inactive state

---

## 5. Settings — Trucks

- [ ] Navigate to Trucks tab
- [ ] Add a truck (unit number, plate, province)
- [ ] Truck appears in list
- [ ] Edit unit number → verify update

---

## 6. Settings — Rate Rules

- [ ] Navigate to Rate Rules tab
- [ ] Add a rule linked to the billing profile from step 3 (label, crew type, rate per mile e.g. 2.50)
- [ ] Rule appears in list under correct profile
- [ ] Edit rate → save → list shows updated rate

---

## 7. Manual Invoice — Create

- [ ] Go to New Invoice
- [ ] Select billing profile → invoice number auto-generates (e.g. TEST-2026-001)
- [ ] Due date and service period auto-populate
- [ ] Add 3 trip rows:
  - Trip 1: standard solo rate, fill all fields
  - Trip 2: different rate rule
  - Trip 3: add border fee (e.g. $25.00)
- [ ] Verify per-row amounts calculate correctly (miles × rate + border fee)
- [ ] Verify Subtotal = sum of all trip amounts + border fees
- [ ] Verify GST = Subtotal × 5% (to the cent)
- [ ] Verify NET Payable = Subtotal + GST (to the cent)
- [ ] Click "Save as Draft" → redirected to invoice detail page
- [ ] Invoice detail shows all data correctly (amounts, trips, GST number, dates)
- [ ] Dashboard summary card "Total Invoices" increments by 1

---

## 8. PDF Export

- [ ] On invoice detail page, click "Export PDF"
- [ ] PDF downloads or opens
- [ ] All numbers in PDF match the screen exactly (subtotal, GST, total, per-trip amounts)
- [ ] Biller and client info matches the billing profile

---

## 9. Status Changes

- [ ] On draft invoice → "Mark as Sent" button visible
- [ ] Click "Mark as Sent" → badge changes to Sent (blue)
- [ ] Dashboard "Outstanding" card increases by invoice total
- [ ] On sent invoice → "Mark as Paid" button visible
- [ ] Click "Mark as Paid" → badge changes to Paid (green)
- [ ] Dashboard "Outstanding" decreases, "Paid This Year" increases

---

## 10. Dashboard Filter Tabs

- [ ] With multiple invoices of different statuses, filter tabs work:
  - "Draft" tab → shows only drafts
  - "Sent" tab → shows only sent
  - "Paid" tab → shows only paid
  - "All" tab → shows all
- [ ] Clicking a row navigates to invoice detail

---

## 11. AI Scan

- [ ] Go to Scan Trip Sheet
- [ ] Select billing profile
- [ ] Upload a trip sheet image (JPEG/PNG, under 5MB)
- [ ] Click "Scan with AI" → loading state shows (~15s)
- [ ] Trips populate in table
- [ ] Rows with missing truck/rate rule show amber highlight
- [ ] Miles auto-estimate fires for rows with both cities filled
- [ ] Fill in missing truck and rate rule for each amber row
- [ ] Save → redirected to invoice detail
- [ ] Verify Vercel function logs show token count for the scan call

---

## 12. Invoice Edit

- [ ] Open any existing invoice → click Edit (pencil icon) from dashboard
- [ ] Edit page loads with all fields pre-populated
- [ ] Invoice # field is read-only (cannot type in it)
- [ ] Billing profile is locked
- [ ] Change one trip's mileage → click "Update Invoice"
- [ ] Redirected to invoice detail → updated amount shows
- [ ] Open a paid invoice → yellow warning banner visible at top of edit form

---

## 13. File Size Validation

- [ ] On scan page, try uploading a file > 5MB → error message shown before any API call
- [ ] Try uploading a non-image file (e.g. .pdf) → error message shown

---

## 14. Vercel Logs

- [ ] After running a scan, open Vercel dashboard → Functions → check logs
- [ ] `/api/scan` log shows: image size, token counts, estimated cost
- [ ] `/api/estimate-miles` log shows: city pair, miles, token count, cost
