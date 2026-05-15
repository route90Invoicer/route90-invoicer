'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { createBillingProfile, updateBillingProfile } from '@/app/actions/settings'

const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1px solid rgba(0,0,0,0.12)', fontSize: 14,
  fontFamily: 'inherit', color: '#1D1D1F', backgroundColor: 'white',
  outline: 'none', boxSizing: 'border-box',
}

const SECTION = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: '#AEAEB2',
  marginTop: 4, marginBottom: -4,
}

function blank(profile) {
  return {
    label:                      profile?.label                      ?? '',
    biller_company_name:        profile?.biller_company_name        ?? '',
    biller_address:             profile?.biller_address             ?? '',
    biller_phone:               profile?.biller_phone               ?? '',
    biller_email:               profile?.biller_email               ?? '',
    biller_gst_number:          profile?.biller_gst_number          ?? '',
    client_company_name:        profile?.client_company_name        ?? '',
    client_care_of:             profile?.client_care_of             ?? '',
    client_address:             profile?.client_address             ?? '',
    client_email:               profile?.client_email               ?? '',
    invoice_prefix:             profile?.invoice_prefix             ?? 'INV',
    default_gst_rate:           profile
                                  ? String(((parseFloat(profile.default_gst_rate) || 0) * 100).toFixed(1))
                                  : '5',
    default_payment_terms_days: String(profile?.default_payment_terms_days ?? '30'),
  }
}

export default function BillingProfileModal({ isOpen, profile, onClose }) {
  const router = useRouter()
  const [form, setForm] = useState(() => blank(profile))
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) { setForm(blank(profile)); setError(null); setLoading(false) }
  }, [isOpen, profile])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit() {
    if (!form.label.trim()) { setError('Label is required'); return }
    if (!form.biller_company_name.trim()) { setError('Biller company name is required'); return }
    if (!form.client_company_name.trim()) { setError('Client company name is required'); return }

    setLoading(true)
    setError(null)

    try {
      if (profile) {
        await updateBillingProfile(profile.id, form)
      } else {
        await createBillingProfile(form)
      }
      router.refresh()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const footer = (
    <>
      {error && (
        <span style={{ marginRight: 'auto', fontSize: 12, color: '#FF3B30' }}>
          {error}
        </span>
      )}
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading}>
        {profile ? 'Save' : 'Create'}
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={profile ? 'Edit Billing Profile' : 'Add Billing Profile'}
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        <FormField label="Label" required>
          <input
            style={INPUT}
            value={form.label}
            onChange={set('label')}
            placeholder='e.g. Route90 → ABC Freight'
          />
        </FormField>

        <div style={SECTION}>Biller</div>

        <FormField label="Company Name" required>
          <input
            style={INPUT}
            value={form.biller_company_name}
            onChange={set('biller_company_name')}
          />
        </FormField>

        <FormField label="Address">
          <input
            style={INPUT}
            value={form.biller_address}
            onChange={set('biller_address')}
          />
        </FormField>

        <FormField label="Phone">
          <input
            style={INPUT}
            value={form.biller_phone}
            onChange={set('biller_phone')}
          />
        </FormField>

        <FormField label="Email">
          <input
            style={INPUT}
            type="email"
            value={form.biller_email}
            onChange={set('biller_email')}
          />
        </FormField>

        <FormField label="GST Number">
          <input
            style={INPUT}
            value={form.biller_gst_number}
            onChange={set('biller_gst_number')}
            placeholder="e.g. 123456789 RT0001"
          />
        </FormField>

        <div style={SECTION}>Client</div>

        <FormField label="Company Name" required>
          <input
            style={INPUT}
            value={form.client_company_name}
            onChange={set('client_company_name')}
          />
        </FormField>

        <FormField label="Care Of">
          <input
            style={INPUT}
            value={form.client_care_of}
            onChange={set('client_care_of')}
            placeholder="Optional contact name"
          />
        </FormField>

        <FormField label="Address">
          <input
            style={INPUT}
            value={form.client_address}
            onChange={set('client_address')}
          />
        </FormField>

        <FormField label="Email">
          <input
            style={INPUT}
            type="email"
            value={form.client_email}
            onChange={set('client_email')}
          />
        </FormField>

        <div style={SECTION}>Invoice Settings</div>

        <FormField label="Invoice Prefix">
          <input
            style={INPUT}
            value={form.invoice_prefix}
            onChange={set('invoice_prefix')}
            placeholder="INV"
          />
        </FormField>

        <FormField label="Default GST Rate (%)">
          <input
            style={INPUT}
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.default_gst_rate}
            onChange={set('default_gst_rate')}
          />
        </FormField>

        <FormField label="Payment Terms (days)">
          <input
            style={INPUT}
            type="number"
            min="0"
            value={form.default_payment_terms_days}
            onChange={set('default_payment_terms_days')}
          />
        </FormField>

      </div>
    </Modal>
  )
}
