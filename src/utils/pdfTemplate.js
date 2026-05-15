import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { formatCAD } from './invoiceMath.js'

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

function fmtGstRate(rate) {
  return `${(Number(rate) * 100).toFixed(1)}%`
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },

  // Page-level outer border (absolute, covers inside of padding)
  pageBorder: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 0,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  headerLeft: {
    flex: 1.35,
    padding: 10,
  },
  headerDivider: {
    width: 1,
    backgroundColor: '#000000',
  },
  headerRight: {
    flex: 0.95,
    padding: 10,
  },

  companyName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  invoiceSubtitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 9,
    color: '#6E6E73',
    lineHeight: 1.5,
  },

  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    textAlign: 'right',
    marginBottom: 8,
  },

  metaRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  metaLabel: {
    width: 100,
    backgroundColor: '#f2f2f2',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
    borderWidth: 0.5,
    borderColor: '#000000',
    borderStyle: 'solid',
    fontSize: 9,
  },
  metaValue: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
    borderWidth: 0.5,
    borderColor: '#000000',
    borderStyle: 'solid',
    fontSize: 9,
  },

  // ── Bill-To / Period Summary ─────────────────────────────────────────────
  billSection: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    flexDirection: 'row',
  },
  billLeft: {
    flex: 1,
    padding: 10,
  },
  billDivider: {
    width: 1,
    backgroundColor: '#000000',
  },
  billRight: {
    flex: 1.1,
    padding: 10,
  },

  sectionLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  billToName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  billToDetail: {
    fontSize: 9,
    color: '#6E6E73',
  },

  summaryRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  summaryLabel: {
    width: 100,
    fontSize: 9.5,
    color: '#6E6E73',
  },
  summaryValue: {
    flex: 1,
    fontSize: 9.5,
  },

  // ── Table (Transportation + Adjustments) ────────────────────────────────
  tableSection: {
    marginTop: 10,
  },
  tableTitleBar: {
    backgroundColor: '#f2f2f2',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    borderBottomWidth: 0,
  },
  tableTitleText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
  },
  tableHeaderCell: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 6,
    paddingRight: 6,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#6E6E73',
  },

  // Column widths
  colOrder:  { width: '15%' },
  colRoute:  { width: '31%' },
  colPeriod: { width: '15%' },
  colKm:     { width: '9%',  textAlign: 'right' },
  colMiles:  { width: '9%',  textAlign: 'right' },
  colRate:   { width: '9%',  textAlign: 'right' },
  colAmount: { width: '12%', textAlign: 'right' },

  tableDataCell: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 6,
    paddingRight: 6,
    fontSize: 8.5,
  },

  // ── Bottom Section ───────────────────────────────────────────────────────
  bottomSection: {
    flexDirection: 'row',
    marginTop: 16,
  },
  notesBox: {
    flex: 1.35,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    marginRight: 10,
  },
  totalsBox: {
    flex: 0.85,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  boxTitleBar: {
    backgroundColor: '#f2f2f2',
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 8,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
  },
  boxTitleText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  boxContent: {
    padding: 8,
  },
  notesText: {
    fontSize: 9,
    marginBottom: 4,
  },
  notesTextItalic: {
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
    marginBottom: 4,
  },

  totalsRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
  },
  totalsLabel: {
    flex: 0.6,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 6,
    paddingRight: 6,
    fontSize: 9,
  },
  totalsValue: {
    flex: 0.4,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 6,
    paddingRight: 6,
    fontSize: 9,
    textAlign: 'right',
  },
  netRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#000000',
    borderTopStyle: 'solid',
  },
  netLabel: {
    flex: 0.6,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 6,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  netValue: {
    flex: 0.4,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    paddingRight: 6,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    borderTopStyle: 'solid',
    paddingTop: 6,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8.5,
    color: '#6E6E73',
    textAlign: 'center',
  },
})

// ─── Period Summary computations ──────────────────────────────────────────────

function computePeriodSummary(trips) {
  // Most common truck
  const truckCounts = {}
  for (const t of trips) {
    const tn = t.truck_number_snapshot
    if (tn) truckCounts[tn] = (truckCounts[tn] || 0) + 1
  }
  let truck = '—'
  let maxCount = 0
  for (const [tn, count] of Object.entries(truckCounts)) {
    if (count > maxCount) { maxCount = count; truck = tn }
  }

  // Unique drivers across all driver_names_snapshot arrays
  const driverSet = new Set()
  for (const t of trips) {
    const arr = t.driver_names_snapshot
    if (Array.isArray(arr)) arr.forEach(d => driverSet.add(d))
  }
  const drivers = driverSet.size > 0 ? Array.from(driverSet).join(', ') : '—'

  // Lines
  const lines = trips.length

  // Single vs team: a trip is "team" if driver_names_snapshot has more than 1 name
  let singleCount = 0
  let teamCount = 0
  for (const t of trips) {
    const arr = t.driver_names_snapshot
    if (Array.isArray(arr) && arr.length > 1) teamCount++
    else singleCount++
  }

  // Totals
  let totalKm = 0
  let totalMiles = 0
  let hasKm = false
  for (const t of trips) {
    if (t.total_km != null && !isNaN(t.total_km)) {
      totalKm += Number(t.total_km)
      hasKm = true
    }
    if (t.total_miles != null && !isNaN(t.total_miles)) {
      totalMiles += Number(t.total_miles)
    }
  }

  return {
    truck,
    drivers,
    lines,
    singleTeam: `${singleCount} / ${teamCount}`,
    totalKm: hasKm ? totalKm.toFixed(0) : '—',
    totalMiles: totalMiles.toFixed(0) + ' mi',
  }
}

// ─── Row components ───────────────────────────────────────────────────────────

function TripRow({ trip, index }) {
  const isEven = index % 2 === 0
  const bg = isEven ? '#ffffff' : '#fafafa'

  const route = trip.route_summary ||
    (trip.pickup_city && trip.delivery_city
      ? `${trip.pickup_city} → ${trip.delivery_city}`
      : '—')

  let period
  if (trip.trip_date_start && trip.trip_date_end) {
    if (trip.trip_date_start === trip.trip_date_end) {
      period = fmtDate(trip.trip_date_start)
    } else {
      period = `${fmtDate(trip.trip_date_start)} – ${fmtDate(trip.trip_date_end)}`
    }
  } else {
    period = fmtDate(trip.trip_date_start)
  }

  const orders = Array.isArray(trip.order_numbers) && trip.order_numbers.length > 0
    ? trip.order_numbers.join(', ')
    : '—'

  const km = trip.total_km != null ? Number(trip.total_km).toFixed(0) : '—'
  const miles = Number(trip.total_miles).toFixed(0)
  const rate = '$' + Number(trip.rate_per_mile_snapshot).toFixed(4) + '/mi'
  const amount = formatCAD(trip.amount)

  return (
    <View
      wrap={false}
      style={{
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#cccccc',
        borderBottomStyle: 'solid',
        backgroundColor: bg,
      }}
    >
      <Text style={[S.tableDataCell, S.colOrder]}>{orders}</Text>
      <Text style={[S.tableDataCell, S.colRoute]}>{route}</Text>
      <Text style={[S.tableDataCell, S.colPeriod]}>{period}</Text>
      <Text style={[S.tableDataCell, S.colKm]}>{km}</Text>
      <Text style={[S.tableDataCell, S.colMiles]}>{miles}</Text>
      <Text style={[S.tableDataCell, S.colRate]}>{rate}</Text>
      <Text style={[S.tableDataCell, S.colAmount]}>{amount}</Text>
    </View>
  )
}

// ─── Main Document ────────────────────────────────────────────────────────────

function InvoiceDocument({ invoice, trips, billingProfile: bp }) {
  const ps = computePeriodSummary(trips)

  const borderTrips = trips.filter(t => t.border_fee && Number(t.border_fee) > 0)
  const hasBorderFees = borderTrips.length > 0

  const servicePeriod =
    invoice.period_start && invoice.period_end
      ? `${fmtDate(invoice.period_start)} – ${fmtDate(invoice.period_end)}`
      : '—'

  const paidDate = invoice.paid_at ? fmtDate(invoice.paid_at.split('T')[0]) : '—'
  const dueDate = invoice.due_date ? fmtDate(invoice.due_date) : '—'

  const rigNumbers = trips
    .map(t => t.rig_invoice_number)
    .filter(Boolean)
    .join(', ')

  return (
    <Document>
      <Page size="LETTER" style={S.page}>

        {/* ── HEADER ── */}
        <View style={S.header}>
          {/* Left: biller info */}
          <View style={S.headerLeft}>
            <Text style={S.companyName}>{bp?.biller_company_name || ''}</Text>
            <Text style={S.invoiceSubtitle}>Transportation Invoice</Text>
            {bp?.biller_address
              ? <Text style={S.companyDetail}>{bp.biller_address}</Text>
              : null}
            {bp?.biller_phone
              ? <Text style={S.companyDetail}>{bp.biller_phone}</Text>
              : null}
            {bp?.biller_email
              ? <Text style={S.companyDetail}>{bp.biller_email}</Text>
              : null}
            {bp?.biller_gst_number
              ? <Text style={S.companyDetail}>{'GST/HST #: ' + bp.biller_gst_number}</Text>
              : null}
          </View>

          {/* Vertical divider */}
          <View style={S.headerDivider} />

          {/* Right: invoice meta */}
          <View style={S.headerRight}>
            <Text style={S.invoiceTitle}>Transportation Invoice</Text>

            {[
              ['Invoice #', invoice.invoice_number || '—'],
              ['Service Period', servicePeriod],
              ['Invoice Date', fmtDate(invoice.invoice_date)],
              ['Due Date', dueDate],
              ['Paid Date', paidDate],
            ].map(([label, value]) => (
              <View key={label} style={S.metaRow}>
                <Text style={S.metaLabel}>{label}</Text>
                <Text style={S.metaValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── BILL TO / PERIOD SUMMARY ── */}
        <View style={S.billSection}>
          {/* Bill To */}
          <View style={S.billLeft}>
            <Text style={S.sectionLabel}>Bill To</Text>
            <Text style={S.billToName}>{bp?.client_company_name || ''}</Text>
            {bp?.client_care_of
              ? <Text style={S.billToDetail}>{'c/o ' + bp.client_care_of}</Text>
              : null}
            {bp?.client_address
              ? <Text style={S.billToDetail}>{bp.client_address}</Text>
              : null}
          </View>

          {/* Vertical divider */}
          <View style={S.billDivider} />

          {/* Period Summary */}
          <View style={S.billRight}>
            <Text style={S.sectionLabel}>Period Summary</Text>
            {[
              ['Truck #', ps.truck],
              ['Drivers', ps.drivers],
              ['Lines', String(ps.lines)],
              ['Single / Team', ps.singleTeam],
              ['Total KM', ps.totalKm],
              ['Total Miles', ps.totalMiles],
            ].map(([label, value]) => (
              <View key={label} style={S.summaryRow}>
                <Text style={S.summaryLabel}>{label}</Text>
                <Text style={S.summaryValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── TRANSPORTATION SUMMARY TABLE ── */}
        <View style={S.tableSection}>
          <View style={S.tableTitleBar} wrap={false}>
            <Text style={S.tableTitleText}>Transportation Services</Text>
          </View>
          <View style={S.tableWrapper}>
            <View style={S.tableHeaderRow} wrap={false}>
              <Text style={[S.tableHeaderCell, S.colOrder]}>Order #s</Text>
              <Text style={[S.tableHeaderCell, S.colRoute]}>Route</Text>
              <Text style={[S.tableHeaderCell, S.colPeriod]}>Trip Period</Text>
              <Text style={[S.tableHeaderCell, S.colKm]}>KM</Text>
              <Text style={[S.tableHeaderCell, S.colMiles]}>Miles</Text>
              <Text style={[S.tableHeaderCell, S.colRate]}>Rate</Text>
              <Text style={[S.tableHeaderCell, S.colAmount]}>Amount</Text>
            </View>
            {trips.map((trip, i) => (
              <TripRow key={trip.id} trip={trip} index={i} />
            ))}
          </View>
        </View>

        {/* ── EXTRA STOPS / ADJUSTMENTS TABLE ── */}
        <View style={S.tableSection}>
          <View style={S.tableTitleBar} wrap={false}>
            <Text style={S.tableTitleText}>Extra Stops / Adjustments</Text>
          </View>
          <View style={S.tableWrapper}>
            <View style={S.tableHeaderRow} wrap={false}>
              <Text style={[S.tableHeaderCell, { flex: 1 }]}>Description</Text>
              <Text style={[S.tableHeaderCell, S.colAmount]}>Amount</Text>
            </View>

            {hasBorderFees
              ? borderTrips.map((trip, i) => (
                <View
                  key={'fee-' + trip.id}
                  wrap={false}
                  style={{
                    flexDirection: 'row',
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#cccccc',
                    borderBottomStyle: 'solid',
                    backgroundColor: i % 2 === 0 ? '#ffffff' : '#fafafa',
                  }}
                >
                  <Text style={[S.tableDataCell, { flex: 1 }]}>
                    {trip.border_fee_note || ('Border fee — ' + (trip.rig_invoice_number || trip.id))}
                  </Text>
                  <Text style={[S.tableDataCell, S.colAmount]}>{formatCAD(trip.border_fee)}</Text>
                </View>
              ))
              : [0, 1, 2].map(i => (
                <View
                  key={'empty-' + i}
                  style={{
                    flexDirection: 'row',
                    height: 24,
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#cccccc',
                    borderBottomStyle: 'solid',
                  }}
                >
                  <Text style={[S.tableDataCell, { flex: 1 }]}> </Text>
                  <Text style={[S.tableDataCell, S.colAmount]}> </Text>
                </View>
              ))
            }
          </View>
        </View>

        {/* ── BOTTOM: NOTES + TOTALS ── */}
        <View style={S.bottomSection}>
          {/* Payment Information & Notes */}
          <View style={S.notesBox}>
            <View style={S.boxTitleBar}>
              <Text style={S.boxTitleText}>Payment Information &amp; Notes</Text>
            </View>
            <View style={S.boxContent}>
              {bp?.default_payment_terms_days
                ? <Text style={S.notesText}>{'Payment terms: Net ' + bp.default_payment_terms_days + ' days.'}</Text>
                : null}
              <Text style={S.notesText}>
                Extra stops are not added here and may need to be added separately.
              </Text>
              {invoice.notes
                ? <Text style={S.notesTextItalic}>{invoice.notes}</Text>
                : null}
              {rigNumbers
                ? <Text style={S.notesText}>{'Source trip invoices: ' + rigNumbers}</Text>
                : null}
            </View>
          </View>

          {/* Invoice Totals */}
          <View style={S.totalsBox}>
            <View style={S.boxTitleBar}>
              <Text style={S.boxTitleText}>Invoice Totals</Text>
            </View>
            <View>
              <View style={S.totalsRow}>
                <Text style={S.totalsLabel}>Gross Pay</Text>
                <Text style={S.totalsValue}>{formatCAD(invoice.subtotal)}</Text>
              </View>
              <View style={S.totalsRow}>
                <Text style={S.totalsLabel}>{'GST (' + fmtGstRate(invoice.gst_rate_snapshot) + ')'}</Text>
                <Text style={S.totalsValue}>{formatCAD(invoice.gst_amount)}</Text>
              </View>
              <View style={S.netRow}>
                <Text style={S.netLabel}>Net</Text>
                <Text style={S.netValue}>{formatCAD(invoice.total)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={S.footer}>
          <Text style={S.footerText}>
            {(bp?.biller_company_name || '') + ' • GST/HST #: ' + (bp?.biller_gst_number || '')}
          </Text>
        </View>

      </Page>
    </Document>
  )
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateAndDownloadPDF(invoice, trips, billingProfile) {
  const blob = await pdf(
    <InvoiceDocument invoice={invoice} trips={trips} billingProfile={billingProfile} />
  ).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoice_${invoice.invoice_number}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
