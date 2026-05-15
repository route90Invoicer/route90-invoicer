import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCAD } from '@/utils/invoiceMath'
import InvoiceActions from '@/components/forms/InvoiceActions'

export const metadata = { title: 'Invoice — Route90 Invoicer' }

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-').map(Number)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[month - 1]} ${day}, ${year}`
}

function fmtGstRate(rate) {
  return `${parseFloat((Number(rate) * 100).toFixed(3))}%`
}

export default async function InvoicePage({ params }) {
  const supabase = createClient()

  const [{ data: invoice }, { data: trips }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, billing_profiles(*)')
      .eq('id', params.id)
      .maybeSingle(),
    supabase
      .from('trips')
      .select('*')
      .eq('invoice_id', params.id)
      .order('sort_order'),
  ])

  if (!invoice) notFound()

  const bp = invoice.billing_profiles
  const tripsData = trips ?? []
  const hasBorderFees = tripsData.some(t => t.border_fee && Number(t.border_fee) > 0)

  const servicePeriod =
    invoice.period_start && invoice.period_end
      ? `${fmtDate(invoice.period_start)} – ${fmtDate(invoice.period_end)}`
      : '—'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Action bar / Page header */}
      <InvoiceActions
        invoice={invoice}
        trips={tripsData}
        billingProfile={bp}
      />

      {/* Invoice document */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 14,
        border: '0.5px solid rgba(0,0,0,0.08)',
        padding: '40px 48px',
        marginTop: 20,
      }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1D1D1F', marginBottom: 6 }}>
              {bp?.biller_company_name}
            </div>
            {bp?.biller_address && (
              <div style={{ fontSize: 13, color: '#6E6E73', lineHeight: 1.6 }}>
                {bp.biller_address.split('\n').map((line, i) => <div key={i}>{line}</div>)}
              </div>
            )}
            {bp?.biller_phone && (
              <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 4 }}>{bp.biller_phone}</div>
            )}
            {bp?.biller_email && (
              <div style={{ fontSize: 13, color: '#6E6E73' }}>{bp.biller_email}</div>
            )}
            {bp?.biller_gst_number && (
              <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 6 }}>GST# {bp.biller_gst_number}</div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#4F46E5', letterSpacing: '-0.02em', marginBottom: 14 }}>
              INVOICE
            </div>
            <table style={{ borderSpacing: 0, marginLeft: 'auto' }}>
              <tbody>
                {[
                  ['Invoice #', invoice.invoice_number],
                  ['Service Period', servicePeriod],
                  ['Invoice Date', fmtDate(invoice.invoice_date)],
                  ['Due Date', fmtDate(invoice.due_date)],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td style={{ fontSize: 12, color: '#8E8E93', paddingRight: 16, paddingBottom: 5, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {label}
                    </td>
                    <td style={{ fontSize: 12, fontWeight: 600, color: '#1D1D1F', paddingBottom: 5, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BILL TO */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Bill To
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F', marginBottom: 2 }}>
            {bp?.client_company_name}
          </div>
          {bp?.client_care_of && (
            <div style={{ fontSize: 13, color: '#6E6E73' }}>c/o {bp.client_care_of}</div>
          )}
          {bp?.client_address && (
            <div style={{ fontSize: 13, color: '#6E6E73', lineHeight: 1.6 }}>{bp.client_address}</div>
          )}
        </div>

        {/* TRANSPORTATION TABLE */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Transportation Services
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F2F2F7' }}>
                {[
                  { label: 'RIG Inv #', right: false },
                  { label: 'Order #s', right: false },
                  { label: 'Route', right: false },
                  { label: 'Trip Period', right: false },
                  { label: 'KM', right: true },
                  { label: 'Miles', right: true },
                  { label: 'Rate', right: true },
                  { label: 'Amount', right: true },
                ].map(({ label, right }, i) => (
                  <th key={label} style={{
                    padding: '7px 10px',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#6E6E73',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: right ? 'right' : 'left',
                    whiteSpace: 'nowrap',
                    ...(i === 0 ? { borderRadius: '6px 0 0 6px' } : {}),
                    ...(i === 7 ? { borderRadius: '0 6px 6px 0' } : {}),
                  }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tripsData.map(trip => {
                const route = trip.route_summary ||
                  (trip.pickup_city && trip.delivery_city
                    ? `${trip.pickup_city} → ${trip.delivery_city}`
                    : '—')
                const period =
                  trip.trip_date_start && trip.trip_date_end
                    ? `${fmtDate(trip.trip_date_start)} – ${fmtDate(trip.trip_date_end)}`
                    : fmtDate(trip.trip_date_start)
                const orders = trip.order_numbers?.join(', ') || '—'

                return (
                  <tr key={trip.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '9px 10px', fontSize: 13, color: '#1D1D1F' }}>{trip.rig_invoice_number || '—'}</td>
                    <td style={{ padding: '9px 10px', fontSize: 13, color: '#1D1D1F' }}>{orders}</td>
                    <td style={{ padding: '9px 10px', fontSize: 13, color: '#1D1D1F' }}>{route}</td>
                    <td style={{ padding: '9px 10px', fontSize: 12, color: '#6E6E73', whiteSpace: 'nowrap' }}>{period}</td>
                    <td style={{ padding: '9px 10px', fontSize: 13, textAlign: 'right', color: '#1D1D1F' }}>
                      {trip.total_km ? Number(trip.total_km).toFixed(0) : '—'}
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: 13, textAlign: 'right', color: '#1D1D1F' }}>
                      {Number(trip.total_miles).toFixed(0)}
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: 13, textAlign: 'right', color: '#6E6E73' }}>
                      ${Number(trip.rate_per_mile_snapshot).toFixed(4)}
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 600, textAlign: 'right', color: '#1D1D1F' }}>
                      {formatCAD(trip.amount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* BORDER FEES */}
        {hasBorderFees && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Border Fees / Adjustments
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F2F2F7' }}>
                  <th style={{ padding: '7px 10px', fontSize: 10, fontWeight: 700, color: '#6E6E73', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'left', borderRadius: '6px 0 0 6px' }}>
                    Description
                  </th>
                  <th style={{ padding: '7px 10px', fontSize: 10, fontWeight: 700, color: '#6E6E73', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {tripsData.filter(t => t.border_fee && Number(t.border_fee) > 0).map(trip => (
                  <tr key={`fee-${trip.id}`} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: '9px 10px', fontSize: 13, color: '#1D1D1F' }}>
                      {trip.border_fee_note || `Border fee — ${trip.rig_invoice_number || trip.id}`}
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: 13, fontWeight: 600, textAlign: 'right', color: '#1D1D1F' }}>
                      {formatCAD(trip.border_fee)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TOTALS */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
          <div style={{ minWidth: 270 }}>
            {[
              ['Subtotal', formatCAD(invoice.subtotal)],
              [`GST (${fmtGstRate(invoice.gst_rate_snapshot)})`, formatCAD(invoice.gst_amount)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#6E6E73' }}>{label}</span>
                <span style={{ fontSize: 13, color: '#1D1D1F' }}>{value}</span>
              </div>
            ))}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1.5px solid #4F46E5',
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#4F46E5' }}>NET PAYABLE</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#4F46E5' }}>{formatCAD(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        {(invoice.notes || bp?.default_payment_terms_days || bp?.biller_gst_number) && (
          <div style={{ paddingTop: 16, borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
            {invoice.notes && (
              <div style={{ fontSize: 12, color: '#6E6E73', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: '#1D1D1F' }}>Notes: </span>{invoice.notes}
              </div>
            )}
            {bp?.default_payment_terms_days && (
              <div style={{ fontSize: 12, color: '#6E6E73' }}>
                Payment due within {bp.default_payment_terms_days} days of invoice date.
              </div>
            )}
            {bp?.biller_gst_number && (
              <div style={{ fontSize: 11, color: '#8E8E93', marginTop: 4 }}>
                {bp.biller_company_name} is registered for GST. GST# {bp.biller_gst_number}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
