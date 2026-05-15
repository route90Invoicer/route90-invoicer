'use client'

import dynamic from 'next/dynamic'

const NewInvoiceForm = dynamic(() => import('@/components/forms/NewInvoiceForm'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 14, color: '#6B7280' }}>
      Loading form…
    </div>
  ),
})

export default function NewInvoiceFormLoader(props) {
  return <NewInvoiceForm {...props} />
}
