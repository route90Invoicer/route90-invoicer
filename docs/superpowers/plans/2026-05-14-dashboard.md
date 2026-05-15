# Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the /dashboard page showing 4 summary cards with mini SVG bar charts, a filterable invoice table, and an empty state.

**Architecture:** A server component (dashboard/page.js) fetches all invoices with embedded trip count and billing profile label from Supabase, then passes the array to a single client component (DashboardClient.js) that handles filtering, aggregation, and all interactive UI. No refetch on filter — all data is in JS.

**Tech Stack:** Next.js 14 App Router, React 18, Supabase JS, inline styles, lucide-react icons, formatCAD from @/utils/invoiceMath

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/app/(dashboard)/dashboard/page.js` | REPLACE STUB | Server component: Supabase fetch → DashboardClient |
| `src/components/dashboard/DashboardClient.js` | CREATE | All interactive UI: summary cards, filter tabs, invoice table, empty state |

**Reused unchanged:**
- `src/components/ui/Badge.js`
- `src/components/ui/Button.js`
- `src/components/ui/Card.js`
- `src/components/ui/EmptyState.js`
- `src/components/ui/PageHeader.js`
- `src/utils/invoiceMath.js` → `formatCAD`
- `src/lib/supabase/server.js`

---

## Task 1: DashboardClient.js

**Files:**
- Create: `src/components/dashboard/DashboardClient.js`

This is the entire UI. It receives `invoices` — an array of invoice rows, each enriched with `tripCount` (number) and `profileLabel` (string). All aggregation is computed in-component from this array.

### Helper functions (define at module level, outside the component)

- [ ] **Step 1: Write the 5 helper functions**

```js
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, Pencil, Download, FileText } from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { formatCAD } from '@/utils/invoiceMath'

// Returns YYYY-MM for a date string like "2026-05-14" or a Date object
function toYearMonth(dateStr) {
  if (!dateStr) return ''
  return String(dateStr).slice(0, 7)
}

// Returns "2026-05" for N months ago (0 = this month)
function monthsAgo(n) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - n)
  return d.toISOString().slice(0, 7)
}

// Sum invoice totals for a given YYYY-MM string
function sumForMonth(invoices, ym) {
  return invoices
    .filter(inv => toYearMonth(inv.invoice_date) === ym)
    .reduce((acc, inv) => acc + parseFloat(inv.total || 0), 0)
}

// Build 5-bar chart data: months 4→3→2→1→0 ago, values = sum of all invoices in that month
function buildChartBars(invoices) {
  return [4, 3, 2, 1, 0].map(n => ({
    month: monthsAgo(n),
    value: sumForMonth(invoices, monthsAgo(n)),
  }))
}

// Returns "↑ X% vs last month" or "↓ X% vs last month" or "No change"
function trendLabel(current, previous, period = 'last month') {
  if (previous === 0 && current === 0) return 'No activity last period'
  if (previous === 0) return `New this ${period}`
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return 'Same as last period'
  const arrow = pct > 0 ? '↑' : '↓'
  return `${arrow} ${Math.abs(pct)}% vs ${period}`
}
```

- [ ] **Step 2: Write the MiniBarChart sub-component**

```js
function MiniBarChart({ bars }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  const opacities = [0.2, 0.35, 0.5, 0.7, 1.0]

  return (
    <svg width={52} height={28} style={{ display: 'block' }}>
      {bars.map((bar, i) => {
        const barH = Math.max(2, Math.round((bar.value / max) * 24))
        const x = i * 11 + 1
        const y = 26 - barH
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={8}
            height={barH}
            rx={2}
            fill="#4F46E5"
            fillOpacity={opacities[i]}
          />
        )
      })}
    </svg>
  )
}
```

- [ ] **Step 3: Write the SummaryCard sub-component**

```js
function SummaryCard({ label, value, trend, bars }) {
  return (
    <Card style={{ flex: 1, position: 'relative', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#6E6E73',
        }}>
          {label}
        </span>
        <MiniBarChart bars={bars} />
      </div>
      <div style={{
        fontSize: 26,
        fontWeight: 700,
        letterSpacing: '-0.5px',
        color: '#1D1D1F',
        marginTop: 8,
        lineHeight: 1.1,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#6E6E73', marginTop: 6 }}>
        {trend}
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Write the FilterTabs sub-component**

```js
const TABS = ['All', 'Draft', 'Sent', 'Paid']

function FilterTabs({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 2, backgroundColor: 'white',
      borderRadius: 10, padding: 4, border: '0.5px solid rgba(0,0,0,0.06)',
      width: 'fit-content' }}>
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: '5px 14px',
            borderRadius: 7,
            border: 'none',
            fontSize: 13,
            fontWeight: active === tab ? 600 : 400,
            color: active === tab ? '#4F46E5' : '#6E6E73',
            backgroundColor: active === tab ? '#EEF2FF' : 'transparent',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.12s ease',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Write the InvoiceRow sub-component**

```js
function InvoiceRow({ invoice }) {
  const tripCount = invoice.tripCount ?? 0
  const period = invoice.period_start && invoice.period_end
    ? `${invoice.period_start} – ${invoice.period_end}`
    : invoice.invoice_date ?? '—'

  return (
    <tr
      style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer' }}
      onClick={() => window.location.href = `/invoices/${invoice.id}`}
    >
      <td style={{ padding: '12px 14px', fontWeight: 600, letterSpacing: '-0.2px',
        fontSize: 13, color: '#1D1D1F', whiteSpace: 'nowrap' }}>
        {invoice.invoice_number}
      </td>
      <td style={{ padding: '12px 14px', fontSize: 13, color: '#1D1D1F' }}>
        {invoice.profileLabel ?? '—'}
      </td>
      <td style={{ padding: '12px 14px', fontSize: 12, color: '#6E6E73', whiteSpace: 'nowrap' }}>
        {period}
      </td>
      <td style={{ padding: '12px 14px', fontSize: 13, color: '#1D1D1F', textAlign: 'center' }}>
        {tripCount}
      </td>
      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600,
        fontVariantNumeric: 'tabular-nums', color: '#1D1D1F', textAlign: 'right',
        whiteSpace: 'nowrap' }}>
        {formatCAD(invoice.total)}
      </td>
      <td style={{ padding: '12px 14px' }}>
        <Badge variant={invoice.status}>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</Badge>
      </td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
          <Link href={`/invoices/${invoice.id}`} title="View">
            <button style={ACTION_BTN}><Eye size={14} strokeWidth={1.75} /></button>
          </Link>
          <Link href={`/invoices/${invoice.id}/edit`} title="Edit">
            <button style={ACTION_BTN}><Pencil size={14} strokeWidth={1.75} /></button>
          </Link>
          <a href="#" title="Download PDF" onClick={e => e.preventDefault()}>
            <button style={ACTION_BTN}><Download size={14} strokeWidth={1.75} /></button>
          </a>
        </div>
      </td>
    </tr>
  )
}

const ACTION_BTN = {
  background: 'none',
  border: '1px solid rgba(0,0,0,0.10)',
  borderRadius: 6,
  padding: '5px 6px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  color: '#6E6E73',
  lineHeight: 1,
}
```

- [ ] **Step 6: Write the main DashboardClient component**

```js
export default function DashboardClient({ invoices }) {
  const [activeTab, setActiveTab] = useState('All')

  // ── Aggregates ───────────────────────────────────────────
  const thisMonth = monthsAgo(0)
  const lastMonth = monthsAgo(1)
  const thisYear  = new Date().getFullYear().toString()

  const billedThisMonth = invoices
    .filter(inv => toYearMonth(inv.invoice_date) === thisMonth)
    .reduce((acc, inv) => acc + parseFloat(inv.total || 0), 0)

  const billedLastMonth = invoices
    .filter(inv => toYearMonth(inv.invoice_date) === lastMonth)
    .reduce((acc, inv) => acc + parseFloat(inv.total || 0), 0)

  const outstanding = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((acc, inv) => acc + parseFloat(inv.total || 0), 0)

  const outstandingLastMonth = invoices
    .filter(inv => inv.status === 'sent' && toYearMonth(inv.invoice_date) === lastMonth)
    .reduce((acc, inv) => acc + parseFloat(inv.total || 0), 0)

  const paidThisYear = invoices
    .filter(inv => inv.status === 'paid' && String(inv.invoice_date).startsWith(thisYear))
    .reduce((acc, inv) => acc + parseFloat(inv.total || 0), 0)

  const paidLastYear = invoices
    .filter(inv => inv.status === 'paid' && String(inv.invoice_date).startsWith(String(parseInt(thisYear) - 1)))
    .reduce((acc, inv) => acc + parseFloat(inv.total || 0), 0)

  const totalCount = invoices.length
  const lastMonthCount = invoices.filter(inv => toYearMonth(inv.invoice_date) === lastMonth).length

  const allBars = buildChartBars(invoices)
  const sentBars = buildChartBars(invoices.filter(inv => inv.status === 'sent'))
  const paidBars = buildChartBars(invoices.filter(inv => inv.status === 'paid'))
  const countBars = [4,3,2,1,0].map(n => ({
    month: monthsAgo(n),
    value: invoices.filter(inv => toYearMonth(inv.invoice_date) === monthsAgo(n)).length,
  }))

  // ── Filtering ────────────────────────────────────────────
  const filtered = activeTab === 'All'
    ? invoices
    : invoices.filter(inv => inv.status === activeTab.toLowerCase())

  // ── Summary cards config ─────────────────────────────────
  const cards = [
    {
      label: 'Billed This Month',
      value: formatCAD(billedThisMonth),
      trend: trendLabel(billedThisMonth, billedLastMonth),
      bars: allBars,
    },
    {
      label: 'Outstanding',
      value: formatCAD(outstanding),
      trend: trendLabel(outstanding, outstandingLastMonth),
      bars: sentBars,
    },
    {
      label: 'Paid This Year',
      value: formatCAD(paidThisYear),
      trend: trendLabel(paidThisYear, paidLastYear, 'last year'),
      bars: paidBars,
    },
    {
      label: 'Total Invoices',
      value: String(totalCount),
      trend: trendLabel(totalCount, lastMonthCount),
      bars: countBars,
    },
  ]

  // ── Render ───────────────────────────────────────────────
  const newInvoiceActions = (
    <div style={{ display: 'flex', gap: 8 }}>
      <Link href="/invoices/scan">
        <Button variant="secondary" size="md">Scan Trip Sheet</Button>
      </Link>
      <Link href="/invoices/new">
        <Button variant="primary" size="md">New Invoice</Button>
      </Link>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Dashboard" actions={newInvoiceActions} />

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 16 }}>
        {cards.map(card => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {/* Invoice Table */}
      {invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Create your first invoice manually or scan a handwritten trip sheet."
            action={
              <div style={{ display: 'flex', gap: 8 }}>
                <Link href="/invoices/new">
                  <Button variant="primary" size="md">New Invoice</Button>
                </Link>
                <Link href="/invoices/scan">
                  <Button variant="secondary" size="md">Scan Trip Sheet</Button>
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <FilterTabs active={activeTab} onChange={setActiveTab} />
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 14, color: '#6E6E73' }}>
              No {activeTab.toLowerCase()} invoices.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['Invoice #', 'Billing Profile', 'Period', 'Trips', 'Amount', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{
                        textAlign: h === 'Amount' ? 'right' : h === 'Trips' ? 'center' : 'left',
                        padding: '8px 14px',
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: '#6E6E73',
                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(invoice => (
                    <InvoiceRow key={invoice.id} invoice={invoice} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Combine into single file and write it**

Write all the above code into `src/components/dashboard/DashboardClient.js` as one file in this order:
1. All imports
2. Helper functions (`toYearMonth`, `monthsAgo`, `sumForMonth`, `buildChartBars`, `trendLabel`)
3. `ACTION_BTN` constant
4. `MiniBarChart` component
5. `SummaryCard` component
6. `FilterTabs` component
7. `InvoiceRow` component
8. `DashboardClient` (default export)

- [ ] **Step 8: Commit**

```bash
git add src/components/dashboard/DashboardClient.js
git commit -m "feat: add DashboardClient with summary cards, filter tabs, invoice table"
```

---

## Task 2: dashboard/page.js — Server Component

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.js`

The server component fetches `invoices` joined to `billing_profiles` and `trips` count, then normalises the data shape before passing to the client.

- [ ] **Step 1: Replace the stub**

```js
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const metadata = { title: 'Dashboard — Route90 Invoicer' }

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: rawInvoices } = await supabase
    .from('invoices')
    .select('*, trips(count), billing_profiles(label)')
    .order('invoice_date', { ascending: false })

  // Normalise: flatten the embedded count and label
  const invoices = (rawInvoices ?? []).map(inv => ({
    ...inv,
    tripCount: inv.trips?.[0]?.count ?? 0,
    profileLabel: inv.billing_profiles?.label ?? '—',
  }))

  return <DashboardClient invoices={invoices} />
}
```

- [ ] **Step 2: Run build check**

```bash
cd /home/noisynav/Documents/code/Projects/Route90-Invoicer && npx next build 2>&1 | grep -E "error|Error|dashboard" | head -20
```

Expected: `/dashboard` listed, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/dashboard/page.js
git commit -m "feat: build dashboard server component with Supabase fetch"
```

---

## Self-Review

**Spec coverage:**
- ✓ 4 summary cards (Billed This Month, Outstanding, Paid This Year, Total Invoices)
- ✓ Uppercase 11px label
- ✓ Large bold number (formatCAD for money, plain count for #4)
- ✓ Trend label comparing current to previous period
- ✓ Mini SVG bar chart (5 bars, last 5 months, indigo #4F46E5 varying opacity)
- ✓ Filter tabs (All | Draft | Sent | Paid), client-side
- ✓ Invoice table columns: Invoice # | Billing Profile | Period | Trips | Amount | Status | Actions
- ✓ Invoice # bold, letter-spacing -0.2px
- ✓ Amount tabular-nums, font-weight 600
- ✓ Badge component for status
- ✓ Actions: View (Eye), Edit (Pencil), Download PDF (Download stub)
- ✓ Click row → /invoices/[id]
- ✓ Sort newest first (from server)
- ✓ Empty state with two buttons
- ✓ Page bg #F2F2F7 (set by dashboard layout, not this component)
- ✓ Cards white, radius 14px — via Card component
- ✓ No Tailwind, inline styles only
- ✓ No Anthropic imports
- ✓ Supabase server client used in page.js only

**Placeholder scan:** No TBDs or vague steps.

**Type consistency:** `invoice.tripCount`, `invoice.profileLabel` — defined in page.js normalisation step and consumed in InvoiceRow. Consistent throughout.
