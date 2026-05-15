'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { createRateRule, updateRateRule } from '@/app/actions/settings'

const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1px solid rgba(0,0,0,0.12)', fontSize: 14,
  fontFamily: 'inherit', color: '#1D1D1F', backgroundColor: 'white',
  outline: 'none', boxSizing: 'border-box',
}

const SELECT = {
  ...INPUT,
  cursor: 'pointer',
  appearance: 'auto',
}

function blank(rule) {
  return {
    billing_profile_id: rule?.billing_profile_id ?? '',
    label:              rule?.label              ?? '',
    crew_type:          rule?.crew_type          ?? 'solo',
    driver_ids:         rule?.driver_ids         ?? [],
    rate_per_mile:      rule ? String(rule.rate_per_mile) : '',
  }
}

export default function RateRuleModal({ isOpen, rule, onClose, billingProfiles, drivers }) {
  const router = useRouter()
  const [form, setForm] = useState(() => blank(rule))
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(blank(rule))
      setError(null)
      setLoading(false)
    }
  }, [isOpen, rule])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function toggleDriver(driverId) {
    setForm((f) => {
      const ids = f.driver_ids.includes(driverId)
        ? f.driver_ids.filter(id => id !== driverId)
        : [...f.driver_ids, driverId]
      return { ...f, driver_ids: ids }
    })
  }

  async function handleSubmit() {
    if (!form.billing_profile_id) { setError('Select a billing profile'); return }
    if (!form.label.trim()) { setError('Label is required'); return }
    if (form.driver_ids.length === 0) { setError('Select at least one driver'); return }
    if (form.crew_type === 'team' && form.driver_ids.length < 2) { setError('Team requires at least 2 drivers'); return }
    if (!form.rate_per_mile || parseFloat(form.rate_per_mile) <= 0) { setError('Rate per mile must be greater than 0'); return }

    const driver_names_snapshot = drivers
      .filter(d => form.driver_ids.includes(d.id))
      .map(d => d.full_name)

    setLoading(true)
    setError(null)
    try {
      const payload = { ...form, driver_names_snapshot }
      if (rule) {
        await updateRateRule(rule.id, payload)
      } else {
        await createRateRule(payload)
      }
      router.refresh()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const activeDrivers = drivers.filter(d => d.is_active)

  const footer = (
    <>
      {error && (
        <span style={{ fontSize: 12, color: '#FF3B30', marginRight: 'auto' }}>
          {error}
        </span>
      )}
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSubmit} loading={loading}>
        {rule ? 'Save Changes' : 'Add Rule'}
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rule ? 'Edit Rate Rule' : 'Add Rate Rule'}
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* 1. Billing Profile */}
        <FormField label="Billing Profile" required>
          <select style={SELECT} value={form.billing_profile_id} onChange={set('billing_profile_id')}>
            <option value="">Select a billing profile…</option>
            {billingProfiles.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </FormField>

        {/* 2. Label */}
        <FormField label="Label" required>
          <input
            style={INPUT}
            value={form.label}
            onChange={set('label')}
            placeholder="e.g. Solo — Route90 to ABC"
          />
        </FormField>

        {/* 3. Crew Type */}
        <FormField label="Crew Type" required>
          <div style={{ display: 'flex', gap: 24, paddingTop: 4 }}>
            {['solo', 'team'].map(type => (
              <label
                key={type}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 14, cursor: 'pointer', userSelect: 'none',
                }}
              >
                <input
                  type="radio"
                  name="crew_type"
                  value={type}
                  checked={form.crew_type === type}
                  onChange={() => setForm(f => ({ ...f, crew_type: type, driver_ids: [] }))}
                  style={{ accentColor: '#4F46E5', width: 16, height: 16 }}
                />
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            ))}
          </div>
        </FormField>

        {/* 4. Drivers */}
        <FormField label="Drivers" required>
          <div style={{
            border: '1px solid rgba(0,0,0,0.12)', borderRadius: 9,
            overflow: 'hidden', maxHeight: 200, overflowY: 'auto',
          }}>
            {activeDrivers.map((d, i, arr) => (
              <label
                key={d.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', cursor: 'pointer', userSelect: 'none',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  backgroundColor: form.driver_ids.includes(d.id) ? '#F5F3FF' : 'white',
                }}
              >
                <input
                  type="checkbox"
                  checked={form.driver_ids.includes(d.id)}
                  onChange={() => toggleDriver(d.id)}
                  style={{ accentColor: '#4F46E5', width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ fontSize: 14, color: '#1D1D1F' }}>{d.full_name}</span>
                {d.license_class && (
                  <span style={{ fontSize: 12, color: '#AEAEB2', marginLeft: 'auto' }}>
                    {d.license_class}
                  </span>
                )}
              </label>
            ))}
            {activeDrivers.length === 0 && (
              <div style={{ padding: '12px 16px', fontSize: 13, color: '#AEAEB2' }}>
                No active drivers — add drivers first.
              </div>
            )}
          </div>
        </FormField>

        {/* 5. Rate Per Mile */}
        <FormField label="Rate Per Mile ($/mile)" required>
          <input
            style={INPUT}
            type="number"
            step="0.0001"
            min="0"
            value={form.rate_per_mile}
            onChange={set('rate_per_mile')}
            placeholder="e.g. 0.8500"
          />
        </FormField>

      </div>
    </Modal>
  )
}
