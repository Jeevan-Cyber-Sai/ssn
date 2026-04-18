import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminOverviewClient from '@/components/admin/AdminOverviewClient'
import type { Profile } from '@/types/database'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const [nssStudents, yrcStudents, nssEvents, yrcEvents, recentRegs] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }).eq('org', 'NSS').eq('role', 'student'),
    supabase.from('profiles').select('id', { count: 'exact' }).eq('org', 'YRC').eq('role', 'student'),
    supabase.from('events').select('id', { count: 'exact' }).eq('event_type', 'NSS').eq('is_active', true),
    supabase.from('events').select('id', { count: 'exact' }).eq('event_type', 'YRC').eq('is_active', true),
    supabase.from('registrations').select('*, profile:profiles(name, org), event:events(title)').order('registered_at', { ascending: false }).limit(10),
  ])

  return (
    <AdminOverviewClient
      profile={profile as Profile}
      stats={{
        nssStudents: nssStudents.count || 0,
        yrcStudents: yrcStudents.count || 0,
        nssEvents: nssEvents.count || 0,
        yrcEvents: yrcEvents.count || 0,
      }}
      recentRegistrations={recentRegs.data || []}
    />
  )
}
