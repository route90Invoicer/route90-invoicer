# AI Scan Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the /invoices/scan page where a user uploads a handwritten trucking trip sheet photo, AI extracts trips via /api/scan, miles auto-fill via /api/estimate-miles, and the user reviews/edits then saves the invoice using the existing saveInvoice action.

**Architecture:** A server component (scan/page.js) fetches Supabase data then passes it to ScanInvoiceForm (client component). ScanInvoiceForm orchestrates image upload → AI scan → miles estimation → trip review → save. ImageUploadZone and ScanStatusBanner are small presentational components. TripRow and saveInvoice are reused unchanged from Phase 6.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind/inline styles, Supabase JS client, Anthropic API (via existing /api/scan and /api/estimate-miles route handlers), @/utils/invoiceMath

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/utils/imageUtils.js` | CREATE | fileToBase64, validateImageFile |
| `src/components/ui/ScanStatusBanner.js` | CREATE | Post-scan status banner (success/partial/error) |
| `src/components/forms/ImageUploadZone.js` | CREATE | Drag-drop / click / camera upload with preview |
| `src/components/forms/ScanInvoiceForm.js` | CREATE | Main client form: upload → scan → review → save |
| `src/app/(dashboard)/invoices/scan/page.js` | REPLACE STUB | Server component: Supabase fetch + render form |
| `src/tests/extractionTests.js` | CREATE | Mock-based test harness for /api/scan accuracy |

**Reused unchanged:**
- `src/components/forms/TripRow.js`
- `src/app/(dashboard)/invoices/new/actions.js` → `saveInvoice`
- `src/utils/invoiceMath.js`
- `src/components/ui/Button`, `Card`, `FormField`, `PageHeader`
- `src/lib/supabase/server.js`, `src/lib/supabase/client.js`

---

## Task 1: imageUtils.js

**Files:**
- Create: `src/utils/imageUtils.js`

- [ ] **Step 1: Create the file**

```js
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export function validateImageFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Use JPEG, PNG, HEIC, or WebP.`)
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 5 MB.`)
  }
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // result is "data:image/jpeg;base64,XXXX" — strip the prefix
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
```

- [ ] **Step 2: Verify by importing in the browser console**

No automated test possible in this Next.js setup without a browser — visual check in Task 4 when the form uses it. Move on.

- [ ] **Step 3: Commit**

```bash
git add src/utils/imageUtils.js
git commit -m "feat: add imageUtils (fileToBase64, validateImageFile)"
```

---

## Task 2: ScanStatusBanner.js

**Files:**
- Create: `src/components/ui/ScanStatusBanner.js`

- [ ] **Step 1: Create the component**

```js
// Displays extraction result summary above the trip table.
// variant: 'success' | 'partial' | 'error'
export default function ScanStatusBanner({ variant, tripCount, message, onRetry }) {
  const styles = {
    success: {
      bg: '#F0FDF4',
      border: '#86EFAC',
      color: '#166534',
      icon: '✓',
    },
    partial: {
      bg: '#FFFBEB',
      border: '#FCD34D',
      color: '#92400E',
      icon: '⚠',
    },
    error: {
      bg: '#FEF2F2',
      border: '#FECACA',
      color: '#DC2626',
      icon: '✕',
    },
  }

  const s = styles[variant] ?? styles.error

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 14,
        color: s.color,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1 }}>{s.icon}</span>
      <div style={{ flex: 1 }}>
        {variant !== 'error' && tripCount != null && (
          <strong>
            {tripCount} trip{tripCount !== 1 ? 's' : ''} extracted.{' '}
          </strong>
        )}
        {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'none',
            border: `1px solid ${s.border}`,
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 13,
            color: s.color,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Retry
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/ScanStatusBanner.js
git commit -m "feat: add ScanStatusBanner UI component"
```

---

## Task 3: ImageUploadZone.js

**Files:**
- Create: `src/components/forms/ImageUploadZone.js`

- [ ] **Step 1: Create the component**

```js
'use client'

import { useRef, useState } from 'react'

export default function ImageUploadZone({ onFile, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)

  function handleFile(file) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setFileName(file.name)
    onFile(file)
  }

  function handleInputChange(e) {
    handleFile(e.target.files?.[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    handleFile(e.dataTransfer.files?.[0])
  }

  function handleDragOver(e) {
    e.preventDefault()
    if (!disabled) setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleRemove() {
    setPreview(null)
    setFileName(null)
    onFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {preview ? (
        <div
          style={{
            border: '1px solid rgba(0,0,0,0.10)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            backgroundColor: 'white',
          }}
        >
          <img
            src={preview}
            alt="Trip sheet preview"
            style={{
              width: 80,
              height: 80,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.08)',
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1D1D1F', marginBottom: 4 }}>
              {fileName}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Ready to scan</div>
          </div>
          {!disabled && (
            <button
              onClick={handleRemove}
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
              Remove
            </button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? '#4F46E5' : 'rgba(0,0,0,0.15)'}`,
            borderRadius: 12,
            padding: '40px 24px',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: dragging ? '#EEF2FF' : 'white',
            transition: 'all 0.15s ease',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#1D1D1F', marginBottom: 6 }}>
            Drop your trip sheet here
          </div>
          <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
            or click to browse · JPEG, PNG, HEIC, WebP · max 5 MB
          </div>
          <div
            style={{
              display: 'inline-block',
              backgroundColor: '#4F46E5',
              color: 'white',
              borderRadius: 8,
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Choose file / Take photo
          </div>
        </div>
      )}

      {/* Hidden file input — supports camera on mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/forms/ImageUploadZone.js
git commit -m "feat: add ImageUploadZone with drag-drop, click, camera support"
```

---

## Task 4: ScanInvoiceForm.js

**Files:**
- Create: `src/components/forms/ScanInvoiceForm.js`

This is the largest file. It mirrors `NewInvoiceForm.js` but adds the scan flow above the trip table.

- [ ] **Step 1: Create helper — tripNeedsReview**

A trip needs amber highlighting if any of these are blank/null: `rig_invoice_number`, `truck_id`, `rate_rule_id`, `total_miles`.

```js
function tripNeedsReview(trip) {
  return (
    !trip.rig_invoice_number ||
    !trip.truck_id ||
    !trip.rate_rule_id ||
    !trip.total_miles ||
    parseFloat(trip.total_miles) === 0
  )
}
```

- [ ] **Step 2: Create helper — mapScannedTrip**

Converts raw AI JSON fields into the shape TripRow expects (matching `blankTrip()` from NewInvoiceForm):

```js
function mapScannedTrip(raw) {
  return {
    rig_invoice_number:   raw.rig_invoice_number ?? '',
    order_numbers:        (raw.order_numbers ?? []).join(', '),
    trip_date_start:      raw.trip_date_start ?? '',
    trip_date_end:        raw.trip_date_end ?? '',
    truck_id:             '',   // user must pick — no UUID from AI
    truck_number_snapshot: raw.truck_number ?? '',
    rate_rule_id:         '',   // user must pick — no UUID from AI
    crew_type:            'solo',
    driver_names_snapshot: raw.driver_names ?? [],
    rate_per_mile_snapshot: 0,
    pickup_city:          raw.pickup_city ?? '',
    delivery_city:        raw.delivery_city ?? '',
    total_km:             raw.total_km ?? '',
    total_miles:          raw.total_miles ?? '',
    amount:               0,
    has_border_fee:       raw.border_fee != null && raw.border_fee > 0,
    border_fee:           raw.border_fee ?? '',
    border_fee_note:      '',
    _estimatingMiles:     false,  // UI-only flag
  }
}
```

- [ ] **Step 3: Create the full component**

```js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Scan } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import {
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

function mapScannedTrip(raw) {
  return {
    rig_invoice_number:    raw.rig_invoice_number ?? '',
    order_numbers:         (raw.order_numbers ?? []).join(', '),
    trip_date_start:       raw.trip_date_start ?? '',
    trip_date_end:         raw.trip_date_end ?? '',
    truck_id:              '',
    truck_number_snapshot: raw.truck_number ?? '',
    rate_rule_id:          '',
    crew_type:             'solo',
    driver_names_snapshot: raw.driver_names ?? [],
    rate_per_mile_snapshot: 0,
    pickup_city:           raw.pickup_city ?? '',
    delivery_city:         raw.delivery_city ?? '',
    total_km:              raw.total_km ?? '',
    total_miles:           raw.total_miles ?? '',
    amount:                0,
    has_border_fee:        raw.border_fee != null && raw.border_fee > 0,
    border_fee:            raw.border_fee ?? '',
    border_fee_note:       '',
    _estimatingMiles:      false,
  }
}

export default function ScanInvoiceForm({ billingProfiles, trucks, allRateRules }) {
  const router = useRouter()

  // Billing profile + invoice header
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [invoiceNumber, setInvoiceNumber]         = useState('')
  const [invoiceDate, setInvoiceDate]             = useState(todayISO())
  const [dueDate, setDueDate]                     = useState('')
  const [periodStart, setPeriodStart]             = useState('')
  const [periodEnd, setPeriodEnd]                 = useState('')
  const [notes, setNotes]                         = useState('')

  // Scan flow
  const [imageFile, setImageFile]     = useState(null)
  const [scanning, setScanning]       = useState(false)
  const [scanError, setScanError]     = useState('')
  const [scanDone, setScanDone]       = useState(false)
  const [scanUsage, setScanUsage]     = useState(null)

  // Trips
  const [trips, setTrips]     = useState([])
  const [saving, setSaving]   = useState(false)
  const [saveError, setSaveError] = useState('')

  const selectedProfile  = billingProfiles.find(p => p.id === selectedProfileId) ?? null
  const filteredRules    = allRateRules.filter(r => r.billing_profile_id === selectedProfileId)

  const subtotal  = calculateSubtotal(trips) +
    trips.reduce((sum, t) => sum + (t.has_border_fee ? parseFloat(t.border_fee || 0) : 0), 0)
  const gstRate   = selectedProfile ? parseFloat(selectedProfile.default_gst_rate) : 0
  const gstAmount = calculateGST(subtotal, gstRate)
  const total     = calculateTotal(subtotal, gstAmount)

  // ── Profile change ──────────────────────────────────────────────
  async function handleProfileChange(profileId) {
    setSelectedProfileId(profileId)
    if (!profileId) { setInvoiceNumber(''); setDueDate(''); setPeriodStart(''); setPeriodEnd(''); return }

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

  // ── Scan ────────────────────────────────────────────────────────
  async function handleScan() {
    if (!imageFile) return
    setScanError('')
    setScanDone(false)
    setScanning(true)
    setTrips([])

    let base64, mimeType
    try {
      validateImageFile(imageFile)
      base64    = await fileToBase64(imageFile)
      mimeType  = imageFile.type
    } catch (err) {
      setScanError(err.message)
      setScanning(false)
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
      setScanError(err.message)
      setScanning(false)
      return
    }

    setScanUsage(result.usage)
    const mapped = (result.trips ?? []).map(mapScannedTrip)
    setTrips(mapped)
    setScanDone(true)
    setScanning(false)

    // Auto-estimate miles in parallel for trips that have both cities
    const toEstimate = mapped
      .map((t, i) => ({ i, pickup: t.pickup_city, delivery: t.delivery_city }))
      .filter(({ pickup, delivery }) => pickup && delivery)

    if (toEstimate.length > 0) {
      setTrips(prev =>
        prev.map((t, i) =>
          toEstimate.find(e => e.i === i) ? { ...t, _estimatingMiles: true } : t
        )
      )

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
            setTrips(prev =>
              prev.map((t, idx) =>
                idx === i ? { ...t, total_miles: String(miles), _estimatingMiles: false } : t
              )
            )
          } catch {
            setTrips(prev =>
              prev.map((t, idx) =>
                idx === i ? { ...t, _estimatingMiles: false } : t
              )
            )
          }
        })
      )
    }
  }

  // ── Trip CRUD ───────────────────────────────────────────────────
  function handleTripChange(index, updatedTrip) {
    setTrips(prev => prev.map((t, i) => (i === index ? updatedTrip : t)))
  }

  function handleTripRemove(index) {
    setTrips(prev => prev.filter((_, i) => i !== index))
  }

  function addTrip() {
    setTrips(prev => [...prev, {
      rig_invoice_number: '', order_numbers: '', trip_date_start: '',
      trip_date_end: '', truck_id: '', truck_number_snapshot: '',
      rate_rule_id: '', crew_type: 'solo', driver_names_snapshot: [],
      rate_per_mile_snapshot: 0, pickup_city: '', delivery_city: '',
      total_km: '', total_miles: '', amount: 0,
      has_border_fee: false, border_fee: '', border_fee_note: '',
      _estimatingMiles: false,
    }])
  }

  // ── Save ─────────────────────────────────────────────────────────
  async function handleSave(status) {
    if (!selectedProfileId) { setSaveError('Select a billing profile first'); return }
    if (!invoiceNumber)     { setSaveError('Invoice number is missing'); return }
    if (trips.length === 0) { setSaveError('Add at least one trip'); return }

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

    const tripsPayload = trips.map(t => ({
      ...t,
      order_numbers_arr: t.order_numbers
        ? t.order_numbers.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    }))

    const result = await saveInvoice(invoiceData, tripsPayload)
    setSaving(false)
    if (result.error) { setSaveError(result.error); return }
    router.push(`/invoices/${result.invoiceId}`)
  }

  // ── Derived UI state ─────────────────────────────────────────────
  const incompleteCount = trips.filter(tripNeedsReview).length
  const bannerVariant = scanDone
    ? (incompleteCount === 0 ? 'success' : 'partial')
    : null

  const saveButtons = (
    <div style={{ display: 'flex', gap: 10 }}>
      <Button variant="secondary" size="md" loading={saving} onClick={() => handleSave('draft')}>
        Save as Draft
      </Button>
      <Button variant="primary" size="md" loading={saving} onClick={() => handleSave('draft')}>
        Save &amp; View Invoice
      </Button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

      {/* Upload + Scan */}
      <Card padding="md">
        <div style={{ marginBottom: 14, fontSize: 14, fontWeight: 600, color: '#1D1D1F' }}>
          Trip sheet photo
        </div>
        <ImageUploadZone onFile={setImageFile} disabled={scanning} />
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            variant="primary"
            size="md"
            icon={Scan}
            disabled={!imageFile || scanning}
            loading={scanning}
            onClick={handleScan}
          >
            {scanning ? 'Reading your trip sheet… ~15 seconds' : 'Scan with AI'}
          </Button>
          {scanUsage && (
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>
              {scanUsage.input + scanUsage.output} tokens used
            </span>
          )}
        </div>
        {scanError && (
          <div style={{ marginTop: 12, fontSize: 14, color: '#DC2626', backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px' }}>
            {scanError}
          </div>
        )}
      </Card>

      {/* Status Banner */}
      {bannerVariant && (
        <ScanStatusBanner
          variant={bannerVariant}
          tripCount={trips.length}
          message={
            bannerVariant === 'success'
              ? 'All trips look complete. Assign rate rules and save.'
              : `${incompleteCount} trip${incompleteCount !== 1 ? 's' : ''} need review — amber rows are missing required fields.`
          }
        />
      )}

      {/* Invoice Header */}
      {(scanDone || trips.length > 0) && (
        <Card padding="md">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
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

      {/* Trip Table */}
      {trips.length > 0 && (
        <Card padding="md">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['RIG Inv #','Order #s','Trip Period','Truck','Rate Rule','Route','KM','Miles','Rate','Amount','Border Fee',''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600,
                      fontSize: 12, color: '#6B7280', borderBottom: '1px solid rgba(0,0,0,0.08)',
                      whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, index) => (
                  <tr
                    key={index}
                    style={tripNeedsReview(trip) ? {
                      backgroundColor: '#FFFBEB',
                      outline: '1px solid #F59E0B',
                    } : {}}
                  >
                    {trip._estimatingMiles ? (
                      <td colSpan={12} style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>
                        Estimating miles for trip {index + 1}…
                      </td>
                    ) : (
                      // Render as TripRow but wrapped in a fragment so tr is provided by the map above
                      // TripRow renders its own <tr>, so we use it directly inside tbody
                      null
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
```

**Note:** There is a structural issue above — `TripRow` renders its own `<tr>`, but the amber highlight needs to be on that `<tr>`. Fix in Step 4.

- [ ] **Step 4: Fix the TripRow amber highlight approach**

`TripRow` renders its own `<tr>`. To apply amber bg, pass a `highlight` prop to TripRow and have it conditionally apply styles internally. But we cannot modify TripRow without breaking NewInvoiceForm. Instead, render TripRow directly inside `<tbody>` (not inside a wrapping `<tr>`), and add an `outerStyle` prop to TripRow.

**Actually simpler:** Modify `TripRow.js` to accept an optional `rowStyle` prop merged into the `<tr>` style. This is additive and backward-compatible (NewInvoiceForm passes nothing, so no change to existing behavior).

**Modify `src/components/forms/TripRow.js`** — change the `<tr>` line:

```js
// Before (line 55):
<tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>

// After:
<tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', ...rowStyle }}>
```

And add `rowStyle` to the destructured props:

```js
// Before (line 23):
export default function TripRow({ trip, tripIndex, onChange, onRemove, trucks, rateRules }) {

// After:
export default function TripRow({ trip, tripIndex, onChange, onRemove, trucks, rateRules, rowStyle }) {
```

Then in ScanInvoiceForm, replace the broken table body with:

```js
<tbody>
  {trips.map((trip, index) =>
    trip._estimatingMiles ? (
      <tr key={index}>
        <td colSpan={12} style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>
          Estimating miles for trip {index + 1}…
        </td>
      </tr>
    ) : (
      <TripRow
        key={index}
        trip={trip}
        tripIndex={index}
        onChange={handleTripChange}
        onRemove={handleTripRemove}
        trucks={trucks}
        rateRules={filteredRules}
        rowStyle={tripNeedsReview(trip) ? { backgroundColor: '#FFFBEB', outline: '1px solid #F59E0B' } : undefined}
      />
    )
  )}
</tbody>
```

Also add the totals and notes sections and save buttons below the trip table (after closing `</Card>`):

```js
{/* Totals */}
{trips.length > 0 && (
  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
    <Card padding="md">
      <div style={{ minWidth: 280 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 48, fontSize: 14, color: '#1D1D1F', marginBottom: 8 }}>
          <span>Subtotal</span><span>{formatCAD(subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 48, fontSize: 14, color: '#1D1D1F', marginBottom: 12 }}>
          <span>GST ({selectedProfile ? `${(gstRate * 100).toFixed(1)}%` : '—'})</span>
          <span>{formatCAD(gstAmount)}</span>
        </div>
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', gap: 48, fontSize: 16, fontWeight: 700, color: '#4F46E5' }}>
          <span>NET Payable</span><span>{formatCAD(total)}</span>
        </div>
      </div>
    </Card>
  </div>
)}

{/* Notes */}
{trips.length > 0 && (
  <Card padding="md">
    <FormField label="Notes (optional)">
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
        style={{ ...INPUT, resize: 'vertical' }} placeholder="Any additional notes for this invoice…" />
    </FormField>
  </Card>
)}

{/* Save error */}
{saveError && (
  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10,
    padding: '12px 16px', fontSize: 14, color: '#DC2626' }}>
    {saveError}
  </div>
)}

{/* Bottom save buttons */}
{trips.length > 0 && (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingBottom: 32 }}>
    <Button variant="secondary" size="md" loading={saving} onClick={() => handleSave('draft')}>Save as Draft</Button>
    <Button variant="primary"   size="md" loading={saving} onClick={() => handleSave('draft')}>Save &amp; View Invoice</Button>
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/forms/ScanInvoiceForm.js src/components/forms/TripRow.js
git commit -m "feat: add ScanInvoiceForm with AI scan flow and amber row highlighting"
```

---

## Task 5: scan/page.js — Server Component

**Files:**
- Modify: `src/app/(dashboard)/invoices/scan/page.js`

- [ ] **Step 1: Replace the stub**

```js
import { createClient } from '@/lib/supabase/server'
import ScanInvoiceForm from '@/components/forms/ScanInvoiceForm'

export const metadata = { title: 'Scan Trip Sheet — Route90 Invoicer' }

export default async function ScanInvoicePage() {
  const supabase = createClient()

  const [
    { data: billingProfiles },
    { data: trucks },
    { data: allRateRules },
  ] = await Promise.all([
    supabase.from('billing_profiles').select('*').eq('is_active', true).order('label'),
    supabase.from('trucks').select('*').eq('is_active', true).order('unit_number'),
    supabase.from('rate_rules').select('*').eq('is_active', true).order('label'),
  ])

  return (
    <ScanInvoiceForm
      billingProfiles={billingProfiles ?? []}
      trucks={trucks ?? []}
      allRateRules={allRateRules ?? []}
    />
  )
}
```

- [ ] **Step 2: Run build check**

```bash
npx next build 2>&1 | grep -E "error|Error|scan"
```

Expected: no errors, `/invoices/scan` listed as `ƒ (Dynamic)`.

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/invoices/scan/page.js
git commit -m "feat: build scan page server component"
```

---

## Task 6: extractionTests.js — Test Harness

**Files:**
- Create: `src/tests/extractionTests.js`

- [ ] **Step 1: Create the file**

```js
// Run with: node src/tests/extractionTests.js
// Requires ANTHROPIC_API_KEY in env and dev server running on localhost:3000

const SCAN_URL = 'http://localhost:3000/api/scan'

// 1x1 white JPEG in base64 (smallest valid JPEG — placeholder for real images)
const PLACEHOLDER_BASE64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
  'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
  'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
  'MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIRAAAg' +
  'IBBAMAAAAAAAAAAAAAAQIDBAUREiExQf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEA' +
  'AAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwZLlqJnHvcz3E5Vvfr7B6r9Vb1QBQB' +
  'Tn//2Q=='

const MOCK_CASES = [
  {
    label: 'Placeholder image — expect empty or graceful error',
    imageBase64: PLACEHOLDER_BASE64,
    mimeType: 'image/jpeg',
    expectedFields: [],  // AI will likely return [] or an error for a blank image
  },
  {
    label: 'Same placeholder — second call (tests that endpoint handles repeat)',
    imageBase64: PLACEHOLDER_BASE64,
    mimeType: 'image/jpeg',
    expectedFields: [],
  },
]

const FIELDS = [
  'rig_invoice_number',
  'trip_date_start',
  'trip_date_end',
  'pickup_city',
  'delivery_city',
  'total_miles',
]

async function runCase(testCase) {
  const res = await fetch(SCAN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: testCase.imageBase64, mimeType: testCase.mimeType }),
  })

  if (res.status === 422) {
    return { label: testCase.label, status: 'parse_error', trips: [] }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { label: testCase.label, status: 'api_error', error: body.error, trips: [] }
  }

  const { trips } = await res.json()
  return { label: testCase.label, status: 'ok', trips: trips ?? [] }
}

function scoreTrips(actual, expected) {
  if (expected.length === 0) return { matched: 0, total: 0, pct: 100 }

  let matched = 0
  let total = 0

  expected.forEach((exp, i) => {
    const act = actual[i]
    if (!act) return

    FIELDS.forEach(field => {
      if (exp[field] === undefined) return
      total++
      if (String(act[field] ?? '') === String(exp[field] ?? '')) matched++
    })
  })

  return { matched, total, pct: total === 0 ? 100 : Math.round((matched / total) * 100) }
}

async function main() {
  console.log('Route90 Invoicer — /api/scan extraction test harness\n')
  console.log('NOTE: Add real trip sheet images as test cases to get meaningful accuracy scores.')
  console.log('Each test case needs: { label, imageBase64, mimeType, expectedFields: [{field: value, ...}] }\n')

  const results = []

  for (const testCase of MOCK_CASES) {
    process.stdout.write(`Running: "${testCase.label}"… `)
    const result = await runCase(testCase)
    const score  = scoreTrips(result.trips, testCase.expectedFields)
    console.log(`${result.status} | ${result.trips.length} trips | accuracy: ${score.pct}%`)
    results.push({ ...result, score })
  }

  console.log('\n── Summary ──────────────────────────────────────')
  const allPcts = results.map(r => r.score.pct)
  const avg = Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length)
  console.log(`Cases: ${results.length} | Avg accuracy: ${avg}%`)

  const fieldFails = {}
  results.forEach(r => {
    r.trips.forEach((trip, i) => {
      const exp = MOCK_CASES[0]?.expectedFields?.[i]
      if (!exp) return
      FIELDS.forEach(f => {
        if (exp[f] !== undefined && String(trip[f] ?? '') !== String(exp[f] ?? '')) {
          fieldFails[f] = (fieldFails[f] ?? 0) + 1
        }
      })
    })
  })

  if (Object.keys(fieldFails).length > 0) {
    console.log('\nFields failing most often:')
    Object.entries(fieldFails)
      .sort((a, b) => b[1] - a[1])
      .forEach(([f, n]) => console.log(`  ${f}: ${n} miss(es)`))
  }

  console.log('\nTo add a real test case:')
  console.log('  1. Convert your RIG trip sheet photo to base64: btoa(binaryString) or use imageUtils.fileToBase64')
  console.log('  2. Add to MOCK_CASES: { label: "...", imageBase64: "...", mimeType: "image/jpeg", expectedFields: [{rig_invoice_number: "685316", ...}] }')
}

main().catch(console.error)
```

- [ ] **Step 2: Run to verify it executes without crashing**

```bash
node src/tests/extractionTests.js
```

Expected: prints the header, attempts fetch (will fail if dev server not running), exits cleanly.

- [ ] **Step 3: Commit**

```bash
git add src/tests/extractionTests.js
git commit -m "feat: add extraction test harness for /api/scan"
```

---

## Self-Review

**Spec coverage check:**
- ✓ Billing profile selector — Task 4
- ✓ Image upload zone (drag-drop, click, camera) — Task 3
- ✓ Scan with AI button, disabled until image selected — Task 4
- ✓ Loading state "Reading your trip sheet… ~15 seconds" — Task 4
- ✓ Trips auto-populate from AI response — Task 4 (mapScannedTrip)
- ✓ Miles auto-estimate in parallel via /api/estimate-miles — Task 4
- ✓ "Estimating miles…" per row while waiting — Task 4 (_estimatingMiles flag)
- ✓ Amber highlight on incomplete rows — Task 4 + TripRow rowStyle prop
- ✓ Invoice header fields same as manual — Task 4
- ✓ TripRow reused, not rebuilt — Task 4
- ✓ saveInvoice action reused — Task 4
- ✓ Server component with Supabase fetch — Task 5
- ✓ Test harness with mock cases — Task 6
- ✓ Mobile camera support (accept=image/*, capture=environment) — Task 3
- ✓ >5MB validation client-side before upload — Task 1 + Task 4
- ✓ ScanStatusBanner (success/partial/error) — Task 2 + Task 4
- ✓ Empty extraction error state — covered by scanError in Task 4
- ✓ API failure: show error + retry — scanError displayed, user can click Scan again

**Placeholder scan:** No TBDs or vague steps found.

**Type consistency:** `mapScannedTrip` output keys match `blankTrip()` shape from NewInvoiceForm exactly. `rowStyle` prop added to TripRow is optional with `undefined` default — backward compatible.
