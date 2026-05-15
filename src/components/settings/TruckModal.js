'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { createTruck, updateTruck } from '@/app/actions/settings'

const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1px solid rgba(0,0,0,0.12)', fontSize: 14,
  fontFamily: 'inherit', color: '#1D1D1F', backgroundColor: 'white',
  outline: 'none', boxSizing: 'border-box',
}

function blank(truck) {
  return {
    unit_number:  truck?.unit_number  ?? '',
    plate_number: truck?.plate_number ?? '',
    province:     truck?.province     ?? '',
  }
}

export default function TruckModal({ isOpen, truck, onClose }) {
  const router = useRouter()
  const [form, setForm] = useState(blank(truck))
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(blank(truck))
      setError(null)
      setLoading(false)
    }
  }, [isOpen, truck])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit() {
    if (!form.unit_number.trim()) {
      setError('Unit number is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (truck) {
        await updateTruck(truck.id, form)
      } else {
        await createTruck(form)
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
        {truck ? 'Save Changes' : 'Add Truck'}
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={truck ? 'Edit Truck' : 'Add Truck'}
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FormField label="Unit Number" required>
          <input
            style={INPUT}
            value={form.unit_number}
            onChange={set('unit_number')}
            placeholder="e.g. 101"
          />
        </FormField>
        <FormField label="Plate Number">
          <input
            style={INPUT}
            value={form.plate_number}
            onChange={set('plate_number')}
          />
        </FormField>
        <FormField label="Province">
          <input
            style={INPUT}
            value={form.province}
            onChange={set('province')}
            placeholder="e.g. MB"
          />
        </FormField>
      </div>
    </Modal>
  )
}
