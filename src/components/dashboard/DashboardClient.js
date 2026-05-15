'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Eye, Pencil, Download, FileText, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react'

import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import PageHeader from '@/components/ui/PageHeader'
import { formatCAD } from '@/utils/invoiceMath'

// ── Helpers ────────────────────────────────────────────────────────────────

function toYearMonth(dateStr) {
  return String(dateStr).slice(0, 7)
}

function monthsAgo(n) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - n)
  return d.toISOString().slice(0, 7)
}

function sumForMonth(invoices, ym) {
  return invoices
    .filter(inv => toYearMonth(inv.invoice_date) === ym)
    .reduce((acc, inv) => acc + parseFloat(inv.total || 0), 0)
}

function buildChartBars(invoices) {
  return [4, 3, 2, 1, 0].map(n => ({
    month: monthsAgo(n),
    value: sumForMonth(invoices, monthsAgo(n)),
  }))
}

function trendLabel(current, previous, period = 'last month') {
  if (previous === 0 && current === 0) return { text: 'No activity', color: '#AEAEB2', direction: 'flat' }
  if (previous === 0) return { text: `New this ${period}`, color: '#34C759', direction: 'up' }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return { text: 'Same as last period', color: '#6E6E73', direction: 'flat' }
  const color = pct > 0 ? '#34C759' : '#FF3B30'
  return { text: `${Math.abs(pct)}% vs ${period}`, color, direction: pct > 0 ? 'up' : 'down' }
}

// ── Mini sparkline ─────────────────────────────────────────────────────────

function MiniBarChart({ bars }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  const opacities = [0.15, 0.28, 0.46, 0.68, 1.0]
  return (
    <svg width={48} height={24} className="block flex-shrink-0">
      {bars.map((bar, i) => {
        const barH = Math.max(2, Math.round((bar.value / max) * 20))
        const x = i * 10 + 1
        const y = 22 - barH
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={7}
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

// ── Summary card ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, trend, bars }) {
  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus
  return (
    <div className="min-w-0 bg-white rounded-[14px] border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-[10.5px] sm:text-[11px] font-semibold tracking-[0.07em] uppercase text-[#6E6E73] leading-snug">
          {label}
        </span>
        <MiniBarChart bars={bars} />
      </div>
      <div className="text-[22px] sm:text-[28px] font-bold tracking-tight text-[#1D1D1F] leading-none tabular-nums mb-2 truncate">
        {value}
      </div>
      <div className="flex items-center gap-1.5">
        <TrendIcon size={12} strokeWidth={2} style={{ color: trend.color, flexShrink: 0 }} />
        <span className="text-[11px] sm:text-[11.5px] leading-none truncate" style={{ color: trend.color }}>
          {trend.text}
        </span>
      </div>
    </div>
  )
}

// Mobile invoice card — replaces table row on small screens
function InvoiceMobileCard({ invoice }) {
  const statusLabel =
    invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
  return (
    <Link
      href={`/invoices/${invoice.id}`}
      className="flex items-center gap-3 px-4 py-4 border-b border-black/[0.05] last:border-0 no-underline active:bg-[#F8F8FA] transition-colors duration-100 min-h-[64px]"
    >
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[14px] font-semibold text-[#1D1D1F] tracking-tight truncate">
            {invoice.invoice_number}
          </span>
          <Badge variant={invoice.status}>{statusLabel}</Badge>
        </div>
        <div className="text-[13px] text-[#6E6E73] truncate">
          {invoice.profileLabel}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[14px] font-semibold text-[#1D1D1F] tabular-nums">
          {formatCAD(invoice.total)}
        </span>
        <span className="text-[11px] text-[#8E8E93]">
          {invoice.tripCount} trip{invoice.tripCount !== 1 ? 's' : ''}
        </span>
      </div>
      <ChevronRight size={18} strokeWidth={1.5} className="text-[#C7C7CC] flex-shrink-0" />
    </Link>
  )
}

// ── Filter tabs ────────────────────────────────────────────────────────────

const TABS = ['All', 'Draft', 'Sent', 'Paid']

function FilterTabs({ active, onChange }) {
  return (
    <div className="flex gap-0 border-b border-black/[0.08]">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={[
            'px-4 py-2.5 text-[13.5px] font-medium border-b-2 -mb-px whitespace-nowrap',
            'transition-colors duration-100 bg-transparent border-0 cursor-pointer font-[inherit]',
            active === tab
              ? 'text-indigo-600 border-indigo-600 font-semibold'
              : 'text-[#6E6E73] border-transparent hover:text-[#1D1D1F]',
          ].join(' ')}
          style={{ borderBottom: active === tab ? '2px solid #4F46E5' : '2px solid transparent' }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ── Invoice row ────────────────────────────────────────────────────────────

function InvoiceRow({ invoice }) {
  const period =
    invoice.period_start && invoice.period_end
      ? `${invoice.period_start} – ${invoice.period_end}`
      : invoice.invoice_date ?? '—'

  const statusLabel =
    invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)

  return (
    <tr
      onClick={() => { window.location.href = `/invoices/${invoice.id}` }}
      className="border-b border-black/[0.05] last:border-0 cursor-pointer hover:bg-[#F8F8FA] transition-colors duration-100"
    >
      <td className="px-4 py-3 text-[13px] font-semibold text-[#1D1D1F] whitespace-nowrap tracking-tight">
        {invoice.invoice_number}
      </td>
      <td className="px-4 py-3 text-[13px] text-[#1D1D1F]">
        {invoice.profileLabel}
      </td>
      <td className="px-4 py-3 text-[12px] text-[#6E6E73] whitespace-nowrap">
        {period}
      </td>
      <td className="px-4 py-3 text-[13px] text-[#1D1D1F] text-center">
        {invoice.tripCount}
      </td>
      <td className="px-4 py-3 text-[13px] font-semibold text-[#1D1D1F] text-right whitespace-nowrap tabular-nums">
        {formatCAD(invoice.total)}
      </td>
      <td className="px-4 py-3">
        <Badge variant={invoice.status}>{statusLabel}</Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <Link href={`/invoices/${invoice.id}`}>
            <button
              title="View"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-black/[0.10] text-[#6E6E73] hover:text-[#1D1D1F] hover:border-black/20 transition-all duration-100 bg-transparent cursor-pointer"
            >
              <Eye size={13} strokeWidth={1.75} />
            </button>
          </Link>
          <Link href={`/invoices/${invoice.id}/edit`}>
            <button
              title="Edit"
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-black/[0.10] text-[#6E6E73] hover:text-[#1D1D1F] hover:border-black/20 transition-all duration-100 bg-transparent cursor-pointer"
            >
              <Pencil size={13} strokeWidth={1.75} />
            </button>
          </Link>
          <button
            title="Download PDF"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-black/[0.10] text-[#6E6E73] hover:text-[#1D1D1F] hover:border-black/20 transition-all duration-100 bg-transparent cursor-pointer"
          >
            <Download size={13} strokeWidth={1.75} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function DashboardClient({ invoices }) {
  const [activeTab, setActiveTab] = useState('All')

  // Aggregates
  const thisMonth = monthsAgo(0)
  const lastMonth = monthsAgo(1)
  const thisYear  = new Date().getFullYear().toString()
  const lastYear  = String(parseInt(thisYear) - 1)

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
    .filter(inv => inv.status === 'paid' && String(inv.invoice_date).startsWith(lastYear))
    .reduce((acc, inv) => acc + parseFloat(inv.total || 0), 0)

  const totalCount      = invoices.length
  const lastMonthCount  = invoices.filter(inv => toYearMonth(inv.invoice_date) === lastMonth).length

  const allBars   = buildChartBars(invoices)
  const sentBars  = buildChartBars(invoices.filter(inv => inv.status === 'sent'))
  const paidBars  = buildChartBars(invoices.filter(inv => inv.status === 'paid'))
  const countBars = [4, 3, 2, 1, 0].map(n => ({
    month: monthsAgo(n),
    value: invoices.filter(inv => toYearMonth(inv.invoice_date) === monthsAgo(n)).length,
  }))

  const cards = [
    {
      label: 'Billed This Month',
      value: formatCAD(billedThisMonth),
      trend: trendLabel(billedThisMonth, billedLastMonth),
      bars:  allBars,
    },
    {
      label: 'Outstanding',
      value: formatCAD(outstanding),
      trend: trendLabel(outstanding, outstandingLastMonth),
      bars:  sentBars,
    },
    {
      label: 'Paid This Year',
      value: formatCAD(paidThisYear),
      trend: trendLabel(paidThisYear, paidLastYear, 'last year'),
      bars:  paidBars,
    },
    {
      label: 'Total Invoices',
      value: String(totalCount),
      trend: trendLabel(totalCount, lastMonthCount),
      bars:  countBars,
    },
  ]

  const filtered = useMemo(
    () => activeTab === 'All'
      ? invoices
      : invoices.filter(inv => inv.status === activeTab.toLowerCase()),
    [invoices, activeTab]
  )

  const headerActions = (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Link href="/invoices/scan" className="flex-1 sm:flex-none">
        <Button variant="secondary" size="md" className="w-full sm:w-auto">Scan Trip Sheet</Button>
      </Link>
      <Link href="/invoices/new" className="flex-1 sm:flex-none">
        <Button variant="primary" size="md" className="w-full sm:w-auto">New Invoice</Button>
      </Link>
    </div>
  )

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <PageHeader title="Dashboard" actions={headerActions} />

      {/* Summary cards: 2-col mobile, 4-col desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(card => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Create your first invoice manually or scan a handwritten trip sheet."
            action={
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                <Link href="/invoices/new" className="w-full sm:w-auto">
                  <Button variant="primary" size="md" className="w-full sm:w-auto">New Invoice</Button>
                </Link>
                <Link href="/invoices/scan" className="w-full sm:w-auto">
                  <Button variant="secondary" size="md" className="w-full sm:w-auto">Scan Trip Sheet</Button>
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="px-3 sm:px-5 pt-4 pb-0 overflow-x-auto">
            <FilterTabs active={activeTab} onChange={setActiveTab} />
          </div>

          {filtered.length === 0 ? (
            <div className="py-10 text-center text-[14px] text-[#6E6E73]">
              No {activeTab.toLowerCase()} invoices.
            </div>
          ) : (
            <>
              {/* Mobile: card-per-row list */}
              <div className="md:hidden">
                {filtered.map(invoice => (
                  <InvoiceMobileCard key={invoice.id} invoice={invoice} />
                ))}
              </div>
              {/* Desktop: full table */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr>
                      {[
                        { label: 'Invoice #', align: 'left' },
                        { label: 'Billing Profile', align: 'left' },
                        { label: 'Period', align: 'left' },
                        { label: 'Trips', align: 'center' },
                        { label: 'Amount', align: 'right' },
                        { label: 'Status', align: 'left' },
                        { label: '', align: 'left' },
                      ].map(({ label, align }) => (
                        <th
                          key={label}
                          style={{ textAlign: align }}
                          className="px-4 py-2.5 text-[11px] font-semibold tracking-[0.05em] uppercase text-[#6E6E73] border-b border-black/[0.08] whitespace-nowrap bg-[#F9F9FB]"
                        >
                          {label}
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
            </>
          )}
        </Card>
      )}
    </div>
  )
}
