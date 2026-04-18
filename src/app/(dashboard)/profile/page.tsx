import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from '@/components/dashboard/ProfileClient'
import type { Profile } from '@/types/database'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: registrations } = await supabase
    .from('registrations').select('*, event:events(*)').eq('user_id', user.id).order('registered_at', { ascending: false })

  return <ProfileClient profile={profile as Profile} registrations={registrations || []} />
}
