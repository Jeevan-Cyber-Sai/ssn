import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { Profile } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const [eventsRes, registrationsRes, leaderboardRes] = await Promise.all([
    supabase.from('events').select('*').eq('event_type', profile.org).eq('is_active', true)
      .gte('date', new Date().toISOString()).order('date').limit(3),
    supabase.from('registrations').select('*, event:events(*)').eq('user_id', user.id).order('registered_at', { ascending: false }).limit(5),
    supabase.from('leaderboard').select('*').eq('org', profile.org).limit(5),
  ])

  return (
    <DashboardClient
      profile={profile as Profile}
      upcomingEvents={eventsRes.data || []}
      recentRegistrations={registrationsRes.data || []}
      leaderboard={leaderboardRes.data || []}
    />
  )
}
