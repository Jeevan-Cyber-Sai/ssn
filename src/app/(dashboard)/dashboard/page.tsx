import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import DashboardClient from '@/components/dashboard/DashboardClient'
import type { Profile } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (!user) {
    console.error('No user found', userErr)
    redirect('/login')
  }

  // Create Admin client to safely bypass strict Row Level Security rules on fetching
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: profile, error: profileErr } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (profileErr) {
    console.error('Error fetching profile:', profileErr.message)
  }
  if (!profile) {
    return (
      <div className="p-8 text-white bg-red-600 flex flex-col gap-4 max-w-lg mx-auto mt-20 text-center rounded-3xl shadow-xl">
        <h2 className="text-2xl font-bold">Corrupted Session Detected</h2>
        <p>Your browser is stuck logged into an incomplete "ghost" account that has no profile data. This is preventing you from reaching the login page properly.</p>
        <p className="text-sm opacity-80">Do not hit back. Please click the strictly client-side logout button below.</p>
        <form action="/auth/logout" method="post" className="mt-4">
           <button type="submit" className="w-full px-6 py-4 bg-white text-red-900 rounded-xl font-extrabold hover:bg-gray-100 transition-all">
             Destroy Ghost Session & Return to Login
           </button>
        </form>
      </div>
    )
  }

  const [eventsRes, registrationsRes, leaderboardRes] = await Promise.all([
    supabaseAdmin.from('events').select('*').eq('event_type', profile.org).eq('is_active', true)
      .gte('date', new Date().toISOString()).order('date').limit(3),
    supabaseAdmin.from('registrations').select('*, event:events(*)').eq('user_id', user.id).order('registered_at', { ascending: false }).limit(5),
    supabaseAdmin.from('leaderboard').select('*').eq('org', profile.org).limit(5),
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
