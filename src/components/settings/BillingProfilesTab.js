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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button variant="primary" icon={Plus} onClick={() => open()}>
          Add Profile
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={profiles}
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
