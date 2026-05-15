import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const metadata = { title: 'Dashboard — Route90 Invoicer' }

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: rawInvoices } = await supabase
    .from('invoices')
    .select('*, trips(count), billing_profiles(label)')
    .order('invoice_date', { ascending: false })

  const invoices = (rawInvoices ?? []).map(inv => ({
    ...inv,
    tripCount:    inv.trips?.[0]?.count ?? 0,
    profileLabel: inv.billing_profiles?.label ?? '—',
  }))

  return <DashboardClient invoices={invoices} />
}
