import { createClient } from '@/lib/supabase/server'
import NewInvoiceFormLoader from '@/components/forms/NewInvoiceFormLoader'

export const metadata = { title: 'New Invoice — Route90 Invoicer' }

export default async function NewInvoicePage() {
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
    <NewInvoiceFormLoader
      billingProfiles={billingProfiles ?? []}
      trucks={trucks ?? []}
      allRateRules={allRateRules ?? []}
    />
  )
}
