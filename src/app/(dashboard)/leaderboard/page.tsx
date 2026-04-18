import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LeaderboardClient from '@/components/dashboard/LeaderboardClient'
import type { Profile } from '@/types/database'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const { data: leaderboard } = await supabase.from('leaderboard').select('*').eq('org', profile.org).limit(50)

  return <LeaderboardClient profile={profile as Profile} leaderboard={leaderboard || []} />
}
