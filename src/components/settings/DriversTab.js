'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import DriverModal from './DriverModal'
import { toggleDriverActive } from '@/app/actions/settings'

function initials(name) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function DriversTab({ drivers }) {
  const router = useRouter()
  const [modal, setModal] = useState({ open: false, driver: null })
  const [toggleError, setToggleError] = useState(null)

  function open(driver = null) {
    setModal({ open: true, driver })
  }

  function close() {
    setModal({ open: false, driver: null })
  }

  async function handleToggle(driver) {
    try {
      setToggleError(null)
      await toggleDriverActive(driver.id, !driver.is_active)
      router.refresh()
    } catch (e) {
      setToggleError('Could not update driver status. Please try again.')
    }
  }

  const columns = [
    {
      key: '_avatar',
      label: '',
      width: 48,
      render: (_val, row) => (
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          backgroundColor: '#EEF2FF',
          color: '#4F46E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {initials(row.full_name)}
        </div>
      ),
    },
    {
      key: 'full_name',
      label: 'Name',
    },
    {
      key: 'license_class',
      label: 'License Class',
      width: 140,
    },
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
          Add Driver
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
          data={drivers}
          emptyMessage="No drivers yet — add one to get started."
        />
      </Card>
      <DriverModal isOpen={modal.open} driver={modal.driver} onClose={close} />
    </div>
  )
}
