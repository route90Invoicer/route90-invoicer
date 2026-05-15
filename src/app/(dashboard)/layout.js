import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/DashboardShell'

export default async function DashboardLayout({ children }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userInitial = user.email?.[0]?.toUpperCase() ?? 'U'
  const safeUser = { email: user.email }

  return (
    <DashboardShell user={safeUser} userInitial={userInitial}>
      {children}
    </DashboardShell>
  )
}
