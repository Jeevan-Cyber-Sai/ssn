import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventsClient from '@/components/events/EventsClient'
import type { Profile } from '@/types/database'

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: registrations } = await supabase
    .from('registrations').select('event_id').eq('user_id', user.id)

  const registeredIds = (registrations || []).map((r: any) => r.event_id)

  return <EventsClient profile={profile as Profile} registeredIds={registeredIds} />
}
