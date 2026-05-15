'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileDown, Pencil, Send, CheckCircle, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import PageHeader from '@/components/ui/PageHeader'
import { markInvoiceSent, markInvoicePaid, deleteInvoice } from '@/app/actions/invoices'
import { generateAndDownloadPDF } from '@/utils/pdfTemplate'

export default function InvoiceActions({ invoice, trips, billingProfile }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  function handleStatusChange(action, serverAction) {
    setActiveAction(action)
    startTransition(async () => {
      await serverAction(invoice.id)
      setActiveAction(null)
    })
  }

  async function handleExportPDF() {
    setPdfLoading(true)
    try {
      await generateAndDownloadPDF(invoice, trips, billingProfile)
    } finally {
      setPdfLoading(false)
    }
  }

  function handleDelete() {
    if (!confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`)) return
    setActiveAction('delete')
    startTransition(async () => {
      await deleteInvoice(invoice.id)
      router.push('/invoices')
    })
  }

  const label = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)

  return (
    <PageHeader
      title={
        <span className="flex items-center gap-2.5">
          {invoice.invoice_number}
          <Badge variant={invoice.status}>{label}</Badge>
        </span>
      }
      actions={
        <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:gap-2 sm:items-center sm:flex-wrap sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            icon={FileDown}
            loading={pdfLoading}
            onClick={handleExportPDF}
            className="w-full sm:w-auto"
          >
            Export PDF
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Pencil}
            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
            className="w-full sm:w-auto"
          >
            Edit
          </Button>

          {invoice.status === 'draft' && (
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              loading={isPending && activeAction === 'sent'}
              onClick={() => handleStatusChange('sent', markInvoiceSent)}
              className="w-full sm:w-auto"
            >
              Mark as Sent
            </Button>
          )}

          {invoice.status === 'sent' && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              loading={isPending && activeAction === 'paid'}
              onClick={() => handleStatusChange('paid', markInvoicePaid)}
              className="w-full sm:w-auto"
            >
              Mark as Paid
            </Button>
          )}

          {invoice.status === 'draft' && (
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              loading={isPending && activeAction === 'delete'}
              onClick={handleDelete}
              className="w-full sm:w-auto text-[#FF3B30] hover:text-[#FF3B30] hover:bg-red-50"
            >
              Delete
            </Button>
          )}
        </div>
      }
    />
  )
}
