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

  const [totalStudents, totalEvents, upcomingEvents, recentRegs] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }).eq('org', profile.org).eq('role', 'student'),
    supabase.from('events').select('id', { count: 'exact' }).eq('event_type', profile.org).eq('is_active', true),
    supabase.from('events').select('id', { count: 'exact' }).eq('event_type', profile.org).eq('is_active', true).gte('date', new Date().toISOString()),
    // Because events belong to an org, we can just grab registrations for that org's events
    // Supabase foreign table filtering
    supabase.from('registrations')
      .select('*, profile:profiles!inner(name, org), event:events!inner(title, event_type)')
      .eq('event.event_type', profile.org)
      .order('registered_at', { ascending: false })
      .limit(10),
  ])

  return (
    <AdminOverviewClient
      profile={profile as Profile}
      stats={{
        totalStudents: totalStudents.count || 0,
        totalEvents: totalEvents.count || 0,
        upcomingEvents: upcomingEvents.count || 0,
      }}
      recentRegistrations={recentRegs.data || []}
    />
  )
}
