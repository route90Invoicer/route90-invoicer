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

  const mobileCard = (row) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px] font-semibold text-[#1D1D1F] truncate">{row.label}</span>
            <Badge variant={row.crew_type === 'team' ? 'info' : 'draft'}>
              {row.crew_type === 'team' ? 'Team' : 'Solo'}
            </Badge>
          </div>
          {Array.isArray(row.driver_names_snapshot) && row.driver_names_snapshot.length > 0 && (
            <div className="text-[12.5px] text-[#6E6E73] truncate">
              {row.driver_names_snapshot.join(', ')}
            </div>
          )}
          {row.rate_per_mile != null && (
            <div className="text-[12px] text-[#1D1D1F] mt-1 tabular-nums">
              ${parseFloat(row.rate_per_mile).toFixed(4)}/mile
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <ToggleSwitch checked={row.is_active} onChange={() => handleToggle(row)} />
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); open(row) }}>
            Edit
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="primary" icon={Plus} onClick={() => open()} className="w-full sm:w-auto">
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
      <Card padding="none">
        <DataTable
          columns={columns}
          data={rateRules}
          mobileCard={mobileCard}
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
