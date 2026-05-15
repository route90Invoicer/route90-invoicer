'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import {
  calculateSubtotal,
  calculateGST,
  calculateTotal,
  calculateBillingPeriod,
  generateNextInvoiceNumber,
  formatCAD,
} from '@/utils/invoiceMath'
import { saveInvoice } from '@/app/(dashboard)/invoices/new/actions'
import { updateInvoice } from '@/app/actions/invoices'

import TripRow from '@/components/forms/TripRow'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import FormField from '@/components/ui/FormField'
import PageHeader from '@/components/ui/PageHeader'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function blankTrip() {
  return {
    rig_invoice_number:    '',
    order_numbers:         '',
    trip_date_start:       '',
    trip_date_end:         '',
    truck_id:              '',
    truck_number_snapshot: '',
    rate_rule_id:          '',
    crew_type:             'solo',
    driver_names_snapshot: [],
    rate_per_mile_snapshot: 0,
    pickup_city:           '',
    delivery_city:         '',
    total_km:              '',
    total_miles:           '',
    amount:                0,
    has_border_fee:        false,
    border_fee:            '',
    border_fee_note:       '',
  }
}

export default function NewInvoiceForm({
  billingProfiles,
  trucks,
  allRateRules,
  mode = 'create',
  initialData = null,
  invoiceId = null,
}) {
  const router  = useRouter()
  const isEdit  = mode === 'edit'

  const [selectedProfileId, setSelectedProfileId] = useState(initialData?.billing_profile_id ?? '')
  const [invoiceNumber, setInvoiceNumber]         = useState(initialData?.invoice_number ?? '')
  const [invoiceDate, setInvoiceDate]             = useState(initialData?.invoice_date ?? todayISO())
  const [dueDate, setDueDate]                     = useState(initialData?.due_date ?? '')
  const [periodStart, setPeriodStart]             = useState(initialData?.period_start ?? '')
  const [periodEnd, setPeriodEnd]                 = useState(initialData?.period_end ?? '')
  const [notes, setNotes]                         = useState(initialData?.notes ?? '')
  const [trips, setTrips]                         = useState(initialData?.trips?.length ? initialData.trips : [blankTrip()])
  const [saving, setSaving]                       = useState(false)
  const [saveError, setSaveError]                 = useState('')

  const selectedProfile = billingProfiles.find(p => p.id === selectedProfileId) ?? null
  const filteredRules   = allRateRules.filter(r => r.billing_profile_id === selectedProfileId)

  const subtotal  =
    calculateSubtotal(trips) +
    trips.reduce((sum, t) => sum + (t.has_border_fee ? parseFloat(t.border_fee || 0) : 0), 0)
  const gstRate   = selectedProfile ? parseFloat(selectedProfile.default_gst_rate) : 0
  const gstAmount = calculateGST(subtotal, gstRate)
  const total     = calculateTotal(subtotal, gstAmount)

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
      .from('invoices')
      .select('invoice_number')
      .eq('billing_profile_id', profileId)
    const existing = (data ?? []).map(r => r.invoice_number)
    setInvoiceNumber(generateNextInvoiceNumber(existing, profile.invoice_prefix, new Date().getFullYear()))
  }

  function handleTripChange(index, updatedTrip) {
    setTrips(prev => prev.map((t, i) => (i === index ? updatedTrip : t)))
  }

  function handleTripRemove(index) {
    setTrips(prev => prev.filter((_, i) => i !== index))
  }

  function addTrip() {
    setTrips(prev => [...prev, blankTrip()])
  }

  async function handleSave(status) {
    if (!selectedProfileId) { setSaveError('Select a billing profile first'); return }
    if (!invoiceNumber)     { setSaveError('Invoice number is missing'); return }
    if (trips.length === 0) { setSaveError('Add at least one trip'); return }
    setSaving(true)
    setSaveError('')
    const invoiceData = {
      billing_profile_id: selectedProfileId,
      invoice_number:     invoiceNumber,
      invoice_date:       invoiceDate,
      due_date:           dueDate || null,
      period_start:       periodStart || null,
      period_end:         periodEnd || null,
      status,
      subtotal,
      gst_amount:         gstAmount,
      gst_rate_snapshot:  gstRate,
      total,
      notes:              notes || null,
    }
    const tripsPayload = trips.map(t => ({
      ...t,
      order_numbers_arr: t.order_numbers
        ? t.order_numbers.split(',').map(s => s.trim()).filter(Boolean)
        : [],
    }))
    const result = isEdit
      ? await updateInvoice(invoiceId, invoiceData, tripsPayload)
      : await saveInvoice(invoiceData, tripsPayload)
    setSaving(false)
    if (result.error) { setSaveError(result.error); return }
    router.push(`/invoices/${result.invoiceId}`)
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={isEdit ? `Edit Invoice` : 'New Invoice'}
        subtitle={isEdit && initialData?.invoice_number ? initialData.invoice_number : undefined}
        actions={
          <div className="flex items-center gap-2">
            {isEdit ? (
              <>
                <Link
                  href={`/invoices/${invoiceId}`}
                  className="inline-flex items-center h-9 px-4 text-[14px] font-medium rounded-[9px] border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 transition-colors duration-150"
                >
                  Cancel
                </Link>
                <Button variant="primary" size="md" loading={saving} onClick={() => handleSave(initialData?.status ?? 'draft')}>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="md" loading={saving} onClick={() => handleSave('draft')}>
                  Save as Draft
                </Button>
                <Button variant="primary" size="md" loading={saving} onClick={() => handleSave('draft')}>
                  Save &amp; View
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Paid invoice warning */}
      {isEdit && initialData?.status === 'paid' && (
        <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3 text-[14px] text-amber-800">
          This invoice is marked as paid. Edits will affect your records.
        </div>
      )}

      {/* Billing Profile */}
      <Card padding="md" header="Billing Profile">
        <select
          value={selectedProfileId}
          onChange={e => !isEdit && handleProfileChange(e.target.value)}
          disabled={isEdit}
          className="field-input"
          style={{ opacity: isEdit ? 0.6 : 1, cursor: isEdit ? 'not-allowed' : 'auto' }}
        >
          <option value="">— Select a billing profile —</option>
          {billingProfiles.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        {selectedProfile && (
          <div className="mt-2 text-[12px] text-[#6E6E73] flex items-center gap-3">
            <span>Prefix: <strong className="text-[#1D1D1F]">{selectedProfile.invoice_prefix}</strong></span>
            <span className="text-[#D1D1D6]">·</span>
            <span>GST: <strong className="text-[#1D1D1F]">{(parseFloat(selectedProfile.default_gst_rate) * 100).toFixed(1)}%</strong></span>
          </div>
        )}
      </Card>

      {/* Invoice Header */}
      <Card padding="md" header="Invoice Details">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <FormField label="Invoice #" required>
            <input
              type="text"
              value={invoiceNumber}
              onChange={isEdit ? undefined : e => setInvoiceNumber(e.target.value)}
              readOnly={isEdit}
              className="field-input"
              style={{ opacity: isEdit ? 0.6 : 1, cursor: isEdit ? 'not-allowed' : 'auto' }}
              placeholder="R90-2026-001"
            />
          </FormField>

          <FormField label="Invoice Date" required>
            <input
              type="date"
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
              className="field-input"
            />
          </FormField>

          <FormField label="Service Period">
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="field-input"
                style={{ flex: 1 }}
              />
              <span className="text-[12px] text-[#8E8E93] flex-shrink-0">to</span>
              <input
                type="date"
                value={periodEnd}
                onChange={e => setPeriodEnd(e.target.value)}
                className="field-input"
                style={{ flex: 1 }}
              />
            </div>
          </FormField>

          <FormField label="Due Date">
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="field-input"
            />
          </FormField>
        </div>
      </Card>

      {/* Trips */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-[#1D1D1F] m-0">Trips</h2>
          <Button variant="ghost" size="sm" icon={Plus} onClick={addTrip}>
            Add trip
          </Button>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white rounded-[14px] border border-black/[0.06] py-10 text-center text-[14px] text-[#8E8E93]">
            No trips yet — click &ldquo;Add trip&rdquo; to get started.
          </div>
        ) : (
          <div className="flex flex-col">
            {trips.map((trip, index) => (
              <TripRow
                key={index}
                trip={trip}
                tripIndex={index}
                onChange={handleTripChange}
                onRemove={handleTripRemove}
                trucks={trucks}
                rateRules={filteredRules}
              />
            ))}
          </div>
        )}
      </div>

      {/* Totals + Notes row */}
      <div className="flex flex-col gap-4 items-end">
        {/* Notes */}
        <Card padding="md" className="w-full">
          <FormField label="Notes (optional)">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="field-input"
              style={{ resize: 'vertical' }}
              placeholder="Any additional notes for this invoice…"
            />
          </FormField>
        </Card>

        {/* Totals */}
        <Card padding="md">
          <div className="min-w-[280px] flex flex-col gap-2">
            <div className="flex justify-between gap-12 text-[14px] text-[#6E6E73]">
              <span>Subtotal</span>
              <span className="text-[#1D1D1F] tabular-nums">{formatCAD(subtotal)}</span>
            </div>
            <div className="flex justify-between gap-12 text-[14px] text-[#6E6E73]">
              <span>GST ({selectedProfile ? `${(gstRate * 100).toFixed(1)}%` : '—'})</span>
              <span className="text-[#1D1D1F] tabular-nums">{formatCAD(gstAmount)}</span>
            </div>
            <div className="flex justify-between gap-12 text-[16px] font-bold text-indigo-600 pt-3 border-t border-black/[0.08]">
              <span>NET Payable</span>
              <span className="tabular-nums">{formatCAD(total)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-3 text-[14px] text-red-600">
          {saveError}
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-black/[0.07] -mx-6 px-6 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-4 text-[13px] text-[#6E6E73]">
          <span>Subtotal <strong className="text-[#1D1D1F]">{formatCAD(subtotal)}</strong></span>
          <span className="text-[#D1D1D6]">|</span>
          <span>GST <strong className="text-[#1D1D1F]">{formatCAD(gstAmount)}</strong></span>
          <span className="text-[#D1D1D6]">|</span>
          <span className="font-semibold text-indigo-600">Total <strong>{formatCAD(total)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          {isEdit ? (
            <Button variant="primary" size="md" loading={saving} onClick={() => handleSave(initialData?.status ?? 'draft')}>
              Save Changes
            </Button>
          ) : (
            <>
              <Button variant="secondary" size="md" loading={saving} onClick={() => handleSave('draft')}>
                Save as Draft
              </Button>
              <Button variant="primary" size="md" loading={saving} onClick={() => handleSave('draft')}>
                Save &amp; View
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
