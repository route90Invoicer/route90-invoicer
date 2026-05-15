'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import DataTable from '@/components/ui/DataTable'
import BillingProfileModal from './BillingProfileModal'

export default function BillingProfilesTab({ profiles }) {
  const [modal, setModal] = useState({ open: false, profile: null })

  function open(profile = null) {
    setModal({ open: true, profile })
  }

  function close() {
    setModal({ open: false, profile: null })
  }

  // Rebuild columns with closure-bound open so Edit button works
  const columns = [
    {
      key: 'label',
      label: 'Label',
      width: '22%',
    },
    {
      key: '_rel',
      label: 'Relationship',
      render: (_val, row) => (
        <span>
          {row.biller_company_name}
          <span style={{ color: '#AEAEB2', margin: '0 6px' }}>→</span>
          {row.client_company_name}
        </span>
      ),
    },
    {
      key: 'invoice_prefix',
      label: 'Prefix',
      width: 80,
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
          <div className="text-[14px] font-semibold text-[#1D1D1F] tracking-tight truncate">
            {row.label}
          </div>
          <div className="text-[12.5px] text-[#6E6E73] mt-0.5 truncate">
            {row.biller_company_name} <span className="text-[#AEAEB2]">→</span> {row.client_company_name}
          </div>
          <div className="text-[11.5px] text-[#8E8E93] mt-1">
            Prefix: <span className="text-[#1D1D1F] font-medium">{row.invoice_prefix}</span>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); open(row) }}>
          Edit
        </Button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button variant="primary" icon={Plus} onClick={() => open()} className="w-full sm:w-auto">
          Add Profile
        </Button>
      </div>

      <Card padding="none">
        <DataTable
          columns={columns}
          data={profiles}
          mobileCard={mobileCard}
          emptyMessage="No billing profiles yet — add one to get started."
        />
      </Card>

      <BillingProfileModal
        isOpen={modal.open}
        profile={modal.profile}
        onClose={close}
      />
    </div>
  )
}
