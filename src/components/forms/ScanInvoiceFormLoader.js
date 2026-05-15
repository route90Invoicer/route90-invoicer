'use client'

import dynamic from 'next/dynamic'

const ScanInvoiceForm = dynamic(() => import('@/components/forms/ScanInvoiceForm'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 14, color: '#6B7280' }}>
      Loading form…
    </div>
  ),
})

export default function ScanInvoiceFormLoader(props) {
  return <ScanInvoiceForm {...props} />
}
