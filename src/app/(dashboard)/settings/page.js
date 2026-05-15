import { createClient } from '@/lib/supabase/server'
import SettingsTabs from '@/components/settings/SettingsTabs'

export const metadata = { title: 'Settings — Route90 Invoicer' }

export default async function SettingsPage() {
  const supabase = createClient()

  const results = await Promise.all([
    supabase.from('billing_profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('drivers').select('*').order('full_name'),
    supabase.from('trucks').select('*').order('unit_number'),
    supabase.from('rate_rules').select('*').order('created_at', { ascending: false }),
  ])

  const firstError = results.map(r => r.error).find(Boolean)
  if (firstError) throw new Error(firstError.message)

  const [{ data: billingProfiles }, { data: drivers }, { data: trucks }, { data: rateRules }] = results

  return (
    <SettingsTabs
      billingProfiles={billingProfiles ?? []}
      drivers={drivers ?? []}
      trucks={trucks ?? []}
      rateRules={rateRules ?? []}
    />
  )
}
