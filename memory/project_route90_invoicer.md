---
name: project-route90-invoicer
description: Route90 Invoicer build state — what shipped, what changed, what's left
metadata:
  type: project
---

SHIPPED v1 (2026-05-14) — all 12 original phases complete.

Phase 1 overhaul committed 2026-05-15 (commit df32423): 6 subagents + 4 integration agents.

**Why:** Full UI redesign, AI extraction improvements, multi-sheet scan, PDF rebuild, and performance pass before potential public SaaS launch.

## What changed in the Phase 1 overhaul

### UI (SA1)
- Sidebar, TopBar, DashboardClient, NewInvoiceForm, TripRow, globals.css redesigned
- All 9 UI primitives created: Badge, Button, Card, DataTable, EmptyState, FormField, Modal, PageHeader, Toast
- ToggleSwitch updated; Invoice Detail + Settings pages use primitives
- Apple-style design system: SF Pro, Indigo #4F46E5, #F2F2F7 bg, 14px-radius cards

### AI scan (SA3)
- POST /api/scan extracts new fields: stops[], border_fee_note, calculated_total_miles
- Server-side mileage discrepancy detection (>5% → amber warning in UI)
- Driver profile matching: one DB query, in-memory substring match, populates matched_driver_profiles[]
- Dismissible warning rows in ScanInvoiceForm

### Multi-sheet scan (SA5)
- ImageUploadZone: multi-file, per-file status chips, onFilesChange(files[]) API
- ScanInvoiceForm: N sheets, sequential scanning, trips grouped by sheet, billing period spans all sheets

### PDF (SA6)
- pdfTemplate.js fully rebuilt to match HTML invoice template spec
- Bordered sections, biller/meta header, Bill-To + Period Summary, Transportation + Extra Stops tables, Payment Info + Totals bottom grid
- Uses formatCAD from invoiceMath, snapshot columns only

### Performance (SA2)
- TripRow: 600ms debounced mileage estimator, module-level Map cache, React.memo, useCallback
- useMemo for filtered invoice list in DashboardClient
- next/dynamic lazy loading for NewInvoiceForm and ScanInvoiceForm (via loader wrappers)
- SettingsTabs: CSS show/hide preserves state across tab switches
- revalidatePath: markInvoiceSent/Paid now also invalidate /dashboard; deleteInvoice → /dashboard

### Editable data (SA4)
- TripRow: route_summary, crew_type, driver_names_snapshot, editable amount, stops display, auto-populate on truck/rate rule select
- edit/page.js: route_summary and gst_rate_snapshot added to initialData

## Known issues to address next
- ScanInvoiceForm uses onFilesChange(files[]) but the old ImageUploadZone used onFile(file) — verify this was fully reconciled
- next build passes (confirmed by IA-4) but full E2E not yet tested against live Supabase
- SA1 hit rate limit before completing — Invoice Detail and Settings pages were completed by IA-4 but not as deeply redesigned as the form pages

**How to apply:** All changes are in main, commit df32423. Run `npm run dev` to test.
