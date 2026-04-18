import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { Profile } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (!user) {
    console.error('No user found', userErr)
    redirect('/login')
  }

  const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (profileErr) {
    console.error('Error fetching profile:', profileErr.message)
  }
  if (!profile) {
    return (
      <div className="p-8 text-red-500 flex flex-col gap-4 max-w-lg mx-auto mt-20 text-center">
        <h2 className="text-xl font-bold">Corrupted Account Detected</h2>
        <p>Your user profile data is missing. This usually happens if there was a server error during your initial registration.</p>
        <p>Please log out, return to the registration page, and create a brand new account!</p>
        <form action="/auth/logout" method="post">
           <button type="submit" className="px-6 py-2 bg-red-100 text-red-700 rounded-lg font-bold">Force Logout</button>
        </form>
      </div>
    )
  }

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
