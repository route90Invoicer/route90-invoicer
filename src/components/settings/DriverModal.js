'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { createDriver, updateDriver } from '@/app/actions/settings'

const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1px solid rgba(0,0,0,0.12)', fontSize: 14,
  fontFamily: 'inherit', color: '#1D1D1F', backgroundColor: 'white',
  outline: 'none', boxSizing: 'border-box',
}

function blank(driver) {
  return {
    full_name:     driver?.full_name     ?? '',
    license_class: driver?.license_class ?? '',
    phone:         driver?.phone         ?? '',
    email:         driver?.email         ?? '',
  }
}

export default function DriverModal({ isOpen, driver, onClose }) {
  const router = useRouter()
  const [form, setForm] = useState(blank(driver))
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(blank(driver))
      setError(null)
      setLoading(false)
    }
  }, [isOpen, driver])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit() {
    if (!form.full_name.trim()) {
      setError('Full name is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (driver) {
        await updateDriver(driver.id, form)
      } else {
        await createDriver(form)
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
        <span style={{ fontSize: 12, color: '#FF3B30', marginRight: 'auto' }}>
          {error}
        </span>
      )}
      <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
      <Button variant="primary" loading={loading} onClick={handleSubmit}>
        {driver ? 'Save Changes' : 'Add Driver'}
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={driver ? 'Edit Driver' : 'Add Driver'}
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FormField label="Full Name" required>
          <input style={INPUT} value={form.full_name} onChange={set('full_name')} />
        </FormField>
        <FormField label="License Class">
          <input
            style={INPUT}
            value={form.license_class}
            onChange={set('license_class')}
            placeholder="e.g. Class 1"
          />
        </FormField>
        <FormField label="Phone">
          <input style={INPUT} value={form.phone} onChange={set('phone')} />
        </FormField>
        <FormField label="Email">
          <input
            style={INPUT}
            type="email"
            value={form.email}
            onChange={set('email')}
          />
        </FormField>
      </div>
    </Modal>
  )
}
