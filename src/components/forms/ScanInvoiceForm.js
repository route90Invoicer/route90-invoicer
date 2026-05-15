'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Scan } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import {
  calculateTripAmount,
  calculateSubtotal,
  calculateGST,
  calculateTotal,
  calculateBillingPeriod,
  generateNextInvoiceNumber,
  formatCAD,
} from '@/utils/invoiceMath'
import { validateImageFile, fileToBase64 } from '@/utils/imageUtils'
import { saveInvoice } from '@/app/(dashboard)/invoices/new/actions'

import TripRow from '@/components/forms/TripRow'
import ImageUploadZone from '@/components/forms/ImageUploadZone'
import ScanStatusBanner from '@/components/ui/ScanStatusBanner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import FormField from '@/components/ui/FormField'
import PageHeader from '@/components/ui/PageHeader'

const INPUT = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 14,
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 9,
  fontFamily: 'inherit',
  color: '#1D1D1F',
  backgroundColor: 'white',
  outline: 'none',
  boxSizing: 'border-box',
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function tripNeedsReview(trip) {
  return (
    !trip.rig_invoice_number ||
    !trip.truck_id ||
    !trip.rate_rule_id ||
    !trip.total_miles ||
    parseFloat(trip.total_miles) === 0
  )
}

// SA3's mapScannedTrip — passes through all enrichment fields including SA3 additions
function mapScannedTrip(raw) {
  // KM→miles fallback: handwritten sheets only show KM, so derive miles whenever miles is missing/zero.
  const km    = raw.total_km    != null && raw.total_km    !== '' ? Number(raw.total_km)    : null
  let   miles = raw.total_miles != null && raw.total_miles !== '' ? Number(raw.total_miles) : null
  if ((miles == null || miles === 0) && km != null && km > 0) {
    miles = Math.round(km * 0.621371)
  }

  return {
    rig_invoice_number:          raw.rig_invoice_number ?? '',
    order_numbers:               (raw.order_numbers ?? []).join(', '),
    trip_date_start:             raw.trip_date_start ?? '',
    trip_date_end:               raw.trip_date_end ?? '',
    truck_id:                    '',
    truck_number_snapshot:       raw.truck_number ?? '',
    rate_rule_id:                '',
    crew_type:                   'solo',
    driver_names_snapshot:       raw.driver_names ?? [],
    rate_per_mile_snapshot:      0,
    pickup_city:                 raw.pickup_city ?? '',
    delivery_city:               raw.delivery_city ?? '',
    route_summary:               (raw.stops ?? []).length >= 2
                                   ? (raw.stops).map(s => s.city).filter(Boolean).join(' → ')
                                   : '',
    total_km:                    km    ?? '',
    total_miles:                 miles ?? '',
    amount:                      0,
    has_border_fee:              raw.border_fee != null && raw.border_fee > 0,
    border_fee:                  raw.border_fee ?? '',
    border_fee_note:             raw.border_fee_note ?? '',
    _estimatingMiles:            false,
    // SA3 scan enrichment fields (display only, not saved to DB)
    _stops:                      raw.stops ?? [],
    _calculated_total_miles:     raw.calculated_total_miles ?? null,
    _mileage_discrepancy:        raw.mileage_discrepancy ?? null,
    _mileage_discrepancy_detail: raw.mileage_discrepancy_detail ?? null,
    _matched_driver_profiles:    raw.matched_driver_profiles ?? [],
  }
}

// ─── Billing period helpers ────────────────────────────────────────────────────

function lastDayOfMonth(yyyy, mm) {
  return new Date(parseInt(yyyy, 10), parseInt(mm, 10), 0).getDate()
}

/**
 * Compute the billing period across all trips from all sheets.
 * Rules:
 *   1. Collect every non-null trip_date_start / trip_date_end across all sheets.
 *   2. Use calculateBillingPeriod on the earliest date for the base period.
 *   3. If the latest date falls outside the base period, expand to full month.
 *   4. If no dates at all, return empty strings.
 */
function computeBillingPeriod(sheets) {
  const dates = []
  for (const sheet of sheets) {
    for (const trip of sheet.extractedTrips) {
      if (trip.trip_date_start) dates.push(trip.trip_date_start)
      if (trip.trip_date_end)   dates.push(trip.trip_date_end)
    }
  }

  if (dates.length === 0) return { periodStart: '', periodEnd: '' }

  dates.sort()
  const earliest = dates[0]
  const latest   = dates[dates.length - 1]

  const base = calculateBillingPeriod(earliest)

  if (latest <= base.periodEnd) {
    return { periodStart: base.periodStart, periodEnd: base.periodEnd }
  }

  // Dates span across half-month boundaries — use full month
  const [yyyy, mm] = earliest.split('-')
  const last = lastDayOfMonth(yyyy, mm)
  return {
    periodStart: `${yyyy}-${mm}-01`,
    periodEnd:   `${yyyy}-${mm}-${String(last).padStart(2, '0')}`,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScanInvoiceForm({ billingProfiles, trucks, allRateRules }) {
  const router = useRouter()

  // Invoice header fields
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [invoiceNumber, setInvoiceNumber]         = useState('')
  const [invoiceDate, setInvoiceDate]             = useState(todayISO())
  const [dueDate, setDueDate]                     = useState('')
  const [periodStart, setPeriodStart]             = useState('')
  const [periodEnd, setPeriodEnd]                 = useState('')
  const [notes, setNotes]                         = useState('')

  /**
   * SA5 multi-sheet state.
   * sheets[]: each sheet =
   *   { id, file, status: 'ready'|'scanning'|'done'|'error', extractedTrips[], error }
   */
  const [sheets, setSheets]         = useState([])
  const [scanning, setScanning]     = useState(false)
  const [scanUsage, setScanUsage]   = useState(null)
  const [anyScanned, setAnyScanned] = useState(false)

  /**
   * SA3 dismissed warnings state.
   * Keyed by compound key `${sheetId}-${tripIndex}` so each trip's warning
   * can be dismissed independently across sheets.
   */
  const [dismissedWarnings, setDismissedWarnings] = useState({})

  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState('')

  const selectedProfile = billingProfiles.find(p => p.id === selectedProfileId) ?? null
  const filteredRules   = allRateRules.filter(r => r.billing_profile_id === selectedProfileId)

  // Flatten all trips across all sheets for totals and banner
  const allTrips = sheets.flatMap(s => s.extractedTrips)

  const subtotal  = calculateSubtotal(allTrips) +
    allTrips.reduce((sum, t) => sum + (t.has_border_fee ? parseFloat(t.border_fee || 0) : 0), 0)
  const gstRate   = selectedProfile ? parseFloat(selectedProfile.default_gst_rate) : 0
  const gstAmount = calculateGST(subtotal, gstRate)
  const total     = calculateTotal(subtotal, gstAmount)

  // Build a Map<File, status> for ImageUploadZone status pills
  const fileStatuses = new Map(sheets.map(s => [s.file, s.status]))

  // ── Dismiss a SA3 mileage warning ──────────────────────────────────────────

  function dismissWarning(sheetId, tripIndex) {
    setDismissedWarnings(prev => ({ ...prev, [`${sheetId}-${tripIndex}`]: true }))
  }

  // ── Profile change ──────────────────────────────────────────────────────────

  async function handleProfileChange(profileId) {
    setSelectedProfileId(profileId)
    if (!profileId) {
      setInvoiceNumber('')
      setDueDate('')
      setPeriodStart('')
      setPeriodEnd('')
      return
    }
    const profile = billingProfiles.find(p => p.id === profileId)
    if (!profile) return
    const { periodStart: ps, periodEnd: pe } = calculateBillingPeriod(todayISO())
    setPeriodStart(ps)
    setPeriodEnd(pe)
    const due = new Date()
    due.setDate(due.getDate() + (profile.default_payment_terms_days ?? 30))
    setDueDate(due.toISOString().slice(0, 10))
    const supabase = createClient()
    const { data } = await supabase
      .from('invoices').select('invoice_number').eq('billing_profile_id', profileId)
    const existing = (data ?? []).map(r => r.invoice_number)
    setInvoiceNumber(generateNextInvoiceNumber(existing, profile.invoice_prefix, new Date().getFullYear()))
  }

  // ── Files change (SA5 plural onFilesChange interface) ──────────────────────

  function handleFilesChange(validFiles) {
    setSheets(prev => {
      const kept = prev.filter(s => validFiles.includes(s.file))
      const existingFiles = new Set(kept.map(s => s.file))
      const added = validFiles
        .filter(f => !existingFiles.has(f))
        .map(f => ({
          id: crypto.randomUUID(),
          file: f,
          status: 'ready',
          extractedTrips: [],
          error: null,
        }))
      return [...kept, ...added]
    })
  }

  // ── Estimate miles for a batch of trips inside one sheet ────────────────────

  async function estimateMilesForSheet(sheetId, mapped) {
    // Only estimate when miles is missing/zero — preserve scanned (or km-converted) miles.
    const toEstimate = mapped
      .map((t, i) => ({
        i,
        pickup:   t.pickup_city,
        delivery: t.delivery_city,
        miles:    parseFloat(t.total_miles) || 0,
      }))
      .filter(({ pickup, delivery, miles }) => pickup && delivery && miles === 0)

    if (toEstimate.length === 0) return

    setSheets(prev => prev.map(s => s.id !== sheetId ? s : {
      ...s,
      extractedTrips: s.extractedTrips.map((t, i) =>
        toEstimate.find(e => e.i === i) ? { ...t, _estimatingMiles: true } : t
      ),
    }))

    await Promise.all(
      toEstimate.map(async ({ i, pickup, delivery }) => {
        try {
          const res = await fetch('/api/estimate-miles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pickupCity: pickup, deliveryCity: delivery }),
          })
          if (!res.ok) return
          const { miles } = await res.json()
          if (miles == null) return
          setSheets(prev => prev.map(s => s.id !== sheetId ? s : {
            ...s,
            extractedTrips: s.extractedTrips.map((t, idx) =>
              idx === i ? { ...t, total_miles: String(miles), _estimatingMiles: false } : t
            ),
          }))
        } catch {
          setSheets(prev => prev.map(s => s.id !== sheetId ? s : {
            ...s,
            extractedTrips: s.extractedTrips.map((t, idx) =>
              idx === i ? { ...t, _estimatingMiles: false } : t
            ),
          }))
        }
      })
    )
  }

  // ── Scan a single sheet ─────────────────────────────────────────────────────

  async function scanSheet(sheet) {
    setSheets(prev => prev.map(s => s.id !== sheet.id ? s : { ...s, status: 'scanning', error: null }))

    let base64, mimeType
    try {
      validateImageFile(sheet.file)
      base64   = await fileToBase64(sheet.file)
      mimeType = sheet.file.type
    } catch (err) {
      setSheets(prev => prev.map(s => s.id !== sheet.id ? s : {
        ...s, status: 'error', error: err.message,
      }))
      return
    }

    let result
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Scan failed')
    } catch (err) {
      setSheets(prev => prev.map(s => s.id !== sheet.id ? s : {
        ...s, status: 'error', error: err.message,
      }))
      return
    }

    // Accumulate token usage across sheets
    if (result.usage) {
      setScanUsage(prev => ({
        input:  (prev?.input  ?? 0) + result.usage.input,
        output: (prev?.output ?? 0) + result.usage.output,
      }))
    }

    const mapped = (result.trips ?? []).map(mapScannedTrip)

    // One scanned trip = one card. Match a single rule by crew_type:
    //   1 driver  → look only at solo rules; pick the one whose driver appears.
    //   2 drivers → look only at team rules; pick the one where BOTH drivers appear.
    // No solo-fallback for team trips. If nothing matches, rate_rule_id stays unset
    // and the user picks manually.
    const profileRules = allRateRules.filter(r => r.billing_profile_id === selectedProfileId)

    for (const trip of mapped) {
      const tripDrivers = (trip.driver_names_snapshot ?? [])
        .map(n => String(n).toLowerCase().trim())
        .filter(Boolean)

      if (tripDrivers.length === 0) continue

      const expectedCrewType = tripDrivers.length >= 2 ? 'team' : 'solo'

      // Default the trip's crew_type to match driver count, even if no rule matches —
      // so the crew badge in the UI reflects what was scanned.
      trip.crew_type = expectedCrewType

      if (profileRules.length === 0) continue

      const matched = profileRules.find(rule => {
        if (rule.crew_type !== expectedCrewType) return false
        const ruleNames = (rule.driver_names_snapshot ?? [])
          .map(n => String(n).toLowerCase().trim())
          .filter(Boolean)
        // Every scanned driver must appear (substring either direction to tolerate
        // partial names like "Dilbag Singh" vs "Dilbag Singh Dhaliwal").
        return tripDrivers.every(td =>
          ruleNames.some(rn => rn.includes(td) || td.includes(rn))
        )
      })

      if (matched) {
        trip.rate_rule_id           = matched.id
        trip.rate_per_mile_snapshot = Number(matched.rate_per_mile)
        trip.crew_type              = matched.crew_type
        trip.amount                 = calculateTripAmount(parseFloat(trip.total_miles) || 0, Number(matched.rate_per_mile))
      }
    }

    setSheets(prev => prev.map(s => s.id !== sheet.id ? s : {
      ...s, status: 'done', extractedTrips: mapped, error: null,
    }))

    // Kick off mile estimation without blocking the sequential scan loop
    estimateMilesForSheet(sheet.id, mapped)
  }

  // ── Scan all ready/errored sheets sequentially ─────────────────────────────

  async function handleScanAll() {
    const toScan = sheets.filter(s => s.status === 'ready' || s.status === 'error')
    if (toScan.length === 0) return

    setScanning(true)
    setScanUsage(null)

    for (const sheet of toScan) {
      await scanSheet(sheet)
    }

    setScanning(false)
    setAnyScanned(true)

    // Update billing period based on all extracted trips
    setSheets(current => {
      const { periodStart: ps, periodEnd: pe } = computeBillingPeriod(current)
      if (ps) {
        setPeriodStart(ps)
        setPeriodEnd(pe)
      }
      return current
    })
  }

  // ── Retry a single errored sheet ────────────────────────────────────────────

  async function handleRetrySheet(sheetId) {
    const sheet = sheets.find(s => s.id === sheetId)
    if (!sheet) return
    setSheets(prev => prev.map(s => s.id !== sheetId ? s : { ...s, status: 'ready', error: null }))
    setScanning(true)
    await scanSheet({ ...sheet, status: 'ready' })
    setScanning(false)
    setAnyScanned(true)
    setSheets(current => {
      const { periodStart: ps, periodEnd: pe } = computeBillingPeriod(current)
      if (ps) { setPeriodStart(ps); setPeriodEnd(pe) }
      return current
    })
  }

  // ── Remove a whole sheet (and its trips) ────────────────────────────────────

  function handleRemoveSheet(sheetId) {
    setSheets(prev => prev.filter(s => s.id !== sheetId))
  }

  // ── Per-trip editing within a sheet ─────────────────────────────────────────

  function handleTripChange(sheetId, tripIndex, updatedTrip) {
    setSheets(prev => prev.map(s => s.id !== sheetId ? s : {
      ...s,
      extractedTrips: s.extractedTrips.map((t, i) => i === tripIndex ? updatedTrip : t),
    }))
  }

  function handleTripRemove(sheetId, tripIndex) {
    setSheets(prev => prev.map(s => s.id !== sheetId ? s : {
      ...s,
      extractedTrips: s.extractedTrips.filter((_, i) => i !== tripIndex),
    }))
  }

  function addTripToSheet(sheetId) {
    setSheets(prev => prev.map(s => s.id !== sheetId ? s : {
      ...s,
      extractedTrips: [...s.extractedTrips, {
        rig_invoice_number: '', order_numbers: '', trip_date_start: '',
        trip_date_end: '', truck_id: '', truck_number_snapshot: '',
        rate_rule_id: '', crew_type: 'solo', driver_names_snapshot: [],
        rate_per_mile_snapshot: 0, pickup_city: '', delivery_city: '',
        total_km: '', total_miles: '', amount: 0,
        has_border_fee: false, border_fee: '', border_fee_note: '',
        _estimatingMiles: false,
        _stops: [], _calculated_total_miles: null,
        _mileage_discrepancy: null, _mileage_discrepancy_detail: null,
        _matched_driver_profiles: [],
      }],
    }))
  }

  // ── Save — flatten all sheets into one ordered trip list ───────────────────

  async function handleSave(status) {
    if (!selectedProfileId) { setSaveError('Select a billing profile first'); return }
    if (!invoiceNumber)     { setSaveError('Invoice number is missing'); return }
    if (allTrips.length === 0) { setSaveError('Add at least one trip'); return }

    setSaving(true)
    setSaveError('')

    const invoiceData = {
      billing_profile_id: selectedProfileId,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate || null,
      period_start: periodStart || null,
      period_end: periodEnd || null,
      status,
      subtotal,
      gst_amount: gstAmount,
      gst_rate_snapshot: gstRate,
      total,
      notes: notes || null,
    }

    // Flatten trips from all sheets with sequential sort_order
    let sortOrder = 0
    const tripsPayload = sheets.flatMap(s =>
      s.extractedTrips.map(t => ({
        ...t,
        sort_order: sortOrder++,
        order_numbers_arr: t.order_numbers
          ? t.order_numbers.split(',').map(str => str.trim()).filter(Boolean)
          : [],
      }))
    )

    const result = await saveInvoice(invoiceData, tripsPayload)
    setSaving(false)
    if (result.error) { setSaveError(result.error); return }
    router.push(`/invoices/${result.invoiceId}`)
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const readySheets     = sheets.filter(s => s.status === 'ready')
  const errorSheets     = sheets.filter(s => s.status === 'error')
  const canScan         = (readySheets.length > 0 || errorSheets.length > 0) && !scanning
  const incompleteCount = allTrips.filter(tripNeedsReview).length
  const bannerVariant   = anyScanned
    ? (incompleteCount === 0 ? 'success' : 'partial')
    : null

  const saveButtons = (
    <div className="hidden sm:flex items-center gap-2.5">
      <Button variant="secondary" size="md" loading={saving} onClick={() => handleSave('draft')}>
        Save as Draft
      </Button>
      <Button variant="primary" size="md" loading={saving} onClick={() => handleSave('draft')}>
        Save &amp; View Invoice
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-5 sm:gap-6 pb-32 sm:pb-8">
      <PageHeader title="Scan Trip Sheet" actions={saveButtons} />

      {/* Billing Profile */}
      <div style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 14, padding: 20 }}>
        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500, color: '#1D1D1F' }}>Billing profile</div>
        <select value={selectedProfileId} onChange={e => handleProfileChange(e.target.value)} style={INPUT}>
          <option value="">— Select a billing profile —</option>
          {billingProfiles.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        {selectedProfile && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>
            Invoice prefix: <strong>{selectedProfile.invoice_prefix}</strong>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            GST rate: <strong>{(parseFloat(selectedProfile.default_gst_rate) * 100).toFixed(1)}%</strong>
          </div>
        )}
      </div>

      {/* Upload + Scan — uses SA5's onFilesChange (plural) interface */}
      <Card padding="md">
        <div style={{ marginBottom: 14, fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
          Trip sheet photos
        </div>
        <ImageUploadZone
          onFilesChange={handleFilesChange}
          fileStatuses={fileStatuses}
          disabled={scanning}
        />
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            variant="primary"
            size="md"
            icon={Scan}
            disabled={!canScan}
            loading={scanning}
            onClick={handleScanAll}
          >
            {scanning
              ? `Scanning… (~15s per sheet)`
              : sheets.length > 1
                ? `Scan All Sheets (${sheets.filter(s => s.status === 'ready' || s.status === 'error').length})`
                : 'Scan with AI'}
          </Button>
          {scanUsage && (
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>
              {scanUsage.input + scanUsage.output} tokens used
            </span>
          )}
        </div>
      </Card>

      {/* Status Banner */}
      {bannerVariant && (
        <ScanStatusBanner
          variant={bannerVariant}
          tripCount={allTrips.length}
          message={
            bannerVariant === 'success'
              ? 'All trips look complete. Assign rate rules and save.'
              : `${incompleteCount} trip${incompleteCount !== 1 ? 's' : ''} need review — amber rows are missing required fields.`
          }
        />
      )}

      {/* Invoice Header — shown once any trips exist */}
      {(anyScanned || allTrips.length > 0) && (
        <Card padding="md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField label="Invoice #" required>
              <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} style={INPUT} placeholder="e.g. R90-2026-001" />
            </FormField>
            <FormField label="Invoice date" required>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} style={INPUT} />
            </FormField>
            <FormField label="Service period">
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} style={{ ...INPUT, flex: 1 }} />
                <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>to</span>
                <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} style={{ ...INPUT, flex: 1 }} />
              </div>
            </FormField>
            <FormField label="Due date">
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={INPUT} />
            </FormField>
          </div>
        </Card>
      )}

      {/* Per-sheet trip sections */}
      {sheets.filter(s => s.status === 'done' || s.extractedTrips.length > 0).map(sheet => (
        <Card key={sheet.id} padding="md">
          {/* Sheet header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, paddingBottom: 12,
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
                {sheet.file.name}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                {sheet.extractedTrips.length} trip{sheet.extractedTrips.length !== 1 ? 's' : ''} extracted
              </div>
            </div>
            <button
              onClick={() => handleRemoveSheet(sheet.id)}
              disabled={scanning}
              style={{
                background: 'none',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 13,
                color: '#6B7280',
                cursor: scanning ? 'not-allowed' : 'pointer',
                opacity: scanning ? 0.5 : 1,
              }}
            >
              Remove sheet
            </button>
          </div>

          {/* Trips table */}
          {sheet.extractedTrips.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['RIG Inv #','Order #s','Trip Period','Truck','Rate Rule','Route','KM','Miles','Rate','Amount','Border Fee',''].map((h, i) => (
                      <th key={i} style={{
                        textAlign: 'left', padding: '8px 10px', fontWeight: 600,
                        fontSize: 12, color: '#6B7280', borderBottom: '1px solid rgba(0,0,0,0.08)',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sheet.extractedTrips.map((trip, tripIndex) => {
                    const warningKey = `${sheet.id}-${tripIndex}`
                    return trip._estimatingMiles ? (
                      <tr key={tripIndex}>
                        <td colSpan={12} style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>
                          Estimating miles for trip {tripIndex + 1}…
                        </td>
                      </tr>
                    ) : (
                      <React.Fragment key={tripIndex}>
                        {/* SA3 mileage discrepancy warning row (amber, dismissible) */}
                        {trip._mileage_discrepancy === true && !dismissedWarnings[warningKey] && (
                          <tr>
                            <td colSpan={12} style={{ padding: '0 0 4px 0' }}>
                              <div style={{
                                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                                backgroundColor: '#FFFBEB', border: '1px solid #FCD34D',
                                borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#92400E',
                              }}>
                                <span>
                                  <strong>Mileage discrepancy on trip {tripIndex + 1}:</strong>{' '}
                                  {trip._mileage_discrepancy_detail}
                                </span>
                                <button
                                  onClick={() => dismissWarning(sheet.id, tripIndex)}
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: 16, lineHeight: 1, color: '#92400E', padding: '0 2px', flexShrink: 0,
                                  }}
                                  aria-label="Dismiss mileage warning"
                                >
                                  ×
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* SA3 unverifiable mileage note row (gray) */}
                        {trip._mileage_discrepancy === null && Array.isArray(trip._stops) && trip._stops.length >= 2 && (
                          <tr>
                            <td colSpan={12} style={{ padding: '0 0 4px 0' }}>
                              <div style={{
                                fontSize: 12, color: '#6B7280',
                                backgroundColor: '#F9FAFB', border: '1px solid rgba(0,0,0,0.08)',
                                borderRadius: 8, padding: '6px 12px',
                              }}>
                                Trip {tripIndex + 1}: Stop-by-stop distances not available — mileage unverified.
                              </div>
                            </td>
                          </tr>
                        )}

                        <TripRow
                          trip={trip}
                          tripIndex={tripIndex}
                          onChange={(idx, updated) => handleTripChange(sheet.id, idx, updated)}
                          onRemove={(idx) => handleTripRemove(sheet.id, idx)}
                          trucks={trucks}
                          rateRules={filteredRules}
                          rowStyle={tripNeedsReview(trip) ? { backgroundColor: '#FFFBEB', outline: '1px solid #F59E0B' } : undefined}
                        />
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <Button variant="ghost" size="sm" icon={Plus} onClick={() => addTripToSheet(sheet.id)}>
              Add trip
            </Button>
          </div>
        </Card>
      ))}

      {/* Error sheets that have no trips yet */}
      {sheets.filter(s => s.status === 'error' && s.extractedTrips.length === 0).map(sheet => (
        <Card key={sheet.id} padding="md">
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>{sheet.file.name}</div>
            <button
              onClick={() => handleRemoveSheet(sheet.id)}
              style={{
                background: 'none',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 13,
                color: '#6B7280',
                cursor: 'pointer',
              }}
            >
              Remove sheet
            </button>
          </div>
          <div style={{
            fontSize: 14, color: '#DC2626',
            backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 8, padding: '10px 14px', marginBottom: 12,
          }}>
            {sheet.error}
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleRetrySheet(sheet.id)}
            disabled={scanning}
          >
            Retry
          </Button>
        </Card>
      ))}

      {/* Totals */}
      {allTrips.length > 0 && (
        <div className="flex sm:justify-end">
          <Card padding="md" className="w-full sm:w-auto">
            <div className="w-full sm:min-w-[280px]">
              <div className="flex justify-between gap-6 sm:gap-12 text-[14px] text-[#1D1D1F] mb-2">
                <span>Subtotal</span><span className="tabular-nums">{formatCAD(subtotal)}</span>
              </div>
              <div className="flex justify-between gap-6 sm:gap-12 text-[14px] text-[#1D1D1F] mb-3">
                <span>GST ({selectedProfile ? `${(gstRate * 100).toFixed(1)}%` : '—'})</span>
                <span className="tabular-nums">{formatCAD(gstAmount)}</span>
              </div>
              <div className="border-t border-black/[0.08] pt-3 flex justify-between gap-6 sm:gap-12 text-[16px] font-bold text-indigo-600">
                <span>NET Payable</span><span className="tabular-nums">{formatCAD(total)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Notes */}
      {allTrips.length > 0 && (
        <Card padding="md">
          <FormField label="Notes (optional)">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              style={{ ...INPUT, resize: 'vertical' }} placeholder="Any additional notes for this invoice…" />
          </FormField>
        </Card>
      )}

      {/* Save error */}
      {saveError && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#DC2626' }}>
          {saveError}
        </div>
      )}

      {/* Bottom save buttons — desktop inline; mobile uses sticky bar below */}
      {allTrips.length > 0 && (
        <div className="hidden sm:flex justify-end gap-2.5 pb-8">
          <Button variant="secondary" size="md" loading={saving} onClick={() => handleSave('draft')}>Save as Draft</Button>
          <Button variant="primary"   size="md" loading={saving} onClick={() => handleSave('draft')}>Save &amp; View Invoice</Button>
        </div>
      )}

      {/* Mobile-only sticky bottom subtotal + save bar */}
      {allTrips.length > 0 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-black/[0.08] px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[13px] text-[#6E6E73]">
            <span>Total</span>
            <span className="font-semibold text-indigo-600 text-[15px] tabular-nums">{formatCAD(total)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" loading={saving} onClick={() => handleSave('draft')} className="flex-1">Save Draft</Button>
            <Button variant="primary"   size="md" loading={saving} onClick={() => handleSave('draft')} className="flex-1">Save &amp; View</Button>
          </div>
        </div>
      )}
    </div>
  )
}
