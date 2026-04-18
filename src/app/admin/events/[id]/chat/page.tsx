import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EventChatClient from '@/components/events/EventChatClient'
import type { Profile, Event, EventMessage } from '@/types/database'

export default async function AdminEventChatPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  const { id } = params;

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/admin-login')

  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
  if (!event) redirect('/admin/events')

  // Fetch initial messages
  const { data: initialMessages } = await supabase
    .from('event_messages')
    .select('*, user:profiles(name, role, org, avatar_url)')
    .eq('event_id', id)
    .order('created_at', { ascending: true })

  return <EventChatClient profile={profile as Profile} event={event as Event} initialMessages={initialMessages || []} />
}
