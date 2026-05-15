import { createClient } from '@/lib/supabase/server'
import ScanInvoiceFormLoader from '@/components/forms/ScanInvoiceFormLoader'

export const metadata = { title: 'Scan Trip Sheet — Route90 Invoicer' }

export default async function ScanInvoicePage() {
  const supabase = createClient()

  const [
    { data: billingProfiles },
    { data: trucks },
    { data: allRateRules },
  ] = await Promise.all([
    supabase.from('billing_profiles').select('*').eq('is_active', true).order('label'),
    supabase.from('trucks').select('*').eq('is_active', true).order('unit_number'),
    supabase.from('rate_rules').select('*').eq('is_active', true).order('label'),
  ])

  return (
    <ScanInvoiceFormLoader
      billingProfiles={billingProfiles ?? []}
      trucks={trucks ?? []}
      allRateRules={allRateRules ?? []}
    />
  )
}
