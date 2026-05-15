'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DataTable from '@/components/ui/DataTable'
import ToggleSwitch from '@/components/ui/ToggleSwitch'
import Badge from '@/components/ui/Badge'
import RateRuleModal from './RateRuleModal'
import { toggleRateRuleActive } from '@/app/actions/settings'

export default function RateRulesTab({ rateRules, drivers, billingProfiles }) {
  const router = useRouter()
  const [modal, setModal] = useState({ open: false, rule: null })
  const [toggleError, setToggleError] = useState(null)

  function open(rule = null) {
    setModal({ open: true, rule })
  }

  function close() {
    setModal({ open: false, rule: null })
  }

  async function handleToggle(rule) {
    try {
      await toggleRateRuleActive(rule.id, !rule.is_active)
      setToggleError(null)
      router.refresh()
    } catch (e) {
      setToggleError('Could not update rate rule status. Please try again.')
    }
  }

  const columns = [
    {
      key: 'label',
      label: 'Label',
    },
    {
      key: 'crew_type',
      label: 'Type',
      width: 80,
      render: (val) => (
        <Badge variant={val === 'team' ? 'info' : 'draft'}>
          {val === 'team' ? 'Team' : 'Solo'}
        </Badge>
      ),
    },
    {
      key: 'driver_names_snapshot',
      label: 'Drivers',
      render: (val) => (
        <span style={{ fontSize: 13, color: '#3C3C43' }}>
          {Array.isArray(val) && val.length > 0 ? val.join(', ') : '—'}
        </span>
      ),
    },
    {
      key: 'rate_per_mile',
      label: '$/mile',
      width: 90,
      render: (val) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          {val != null ? `$${parseFloat(val).toFixed(4)}` : '—'}
        </span>
      ),
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
          Add Rule
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
          data={rateRules}
          emptyMessage="No rate rules yet — add one to get started."
        />
      </Card>
      <RateRuleModal
        isOpen={modal.open}
        rule={modal.rule}
        onClose={close}
        billingProfiles={billingProfiles}
        drivers={drivers}
      />
    </div>
  )
}
