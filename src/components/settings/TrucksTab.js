'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import TruckModal from './TruckModal'
import { toggleTruckActive } from '@/app/actions/settings'

export default function TrucksTab({ trucks }) {
  const router = useRouter()
  const [modal, setModal] = useState({ open: false, truck: null })
  const [toggleError, setToggleError] = useState(null)

  function open(truck = null) {
    setModal({ open: true, truck })
  }

  function close() {
    setModal({ open: false, truck: null })
  }

  async function handleToggle(truck) {
    try {
      setToggleError(null)
      await toggleTruckActive(truck.id, !truck.is_active)
      router.refresh()
    } catch (e) {
      setToggleError('Could not update truck status. Please try again.')
    }
  }

  const columns = [
    { key: 'unit_number',  label: 'Unit #',   width: 100 },
    { key: 'plate_number', label: 'Plate',    width: 140 },
    { key: 'province',     label: 'Province', width: 100 },
    {
      key: 'is_active',
      label: 'Active',
      width: 72,
      render: (val, row) => (
        <ToggleSwitch checked={val} onChange={() => handleToggle(row)} />
      ),
    },
    {
      key: '_edit',
      label: '',
      width: 72,
      render: (_val, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => { e.stopPropagation(); open(row) }}
        >
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button variant="primary" icon={Plus} onClick={() => open()}>
          Add Truck
        </Button>
      </div>
      {toggleError && (
        <div style={{
          marginBottom: 12, padding: '10px 14px', borderRadius: 9,
          backgroundColor: '#FFF2F2', border: '1px solid rgba(255,59,48,0.2)',
          fontSize: 13, color: '#FF3B30', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{toggleError}</span>
          <button
            type="button"
            onClick={() => setToggleError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF3B30', padding: '0 0 0 8px', fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}
      <Card>
        <DataTable
          columns={columns}
          data={trucks}
          emptyMessage="No trucks yet — add one to get started."
        />
      </Card>
      <TruckModal isOpen={modal.open} truck={modal.truck} onClose={close} />
    </div>
  )
}
