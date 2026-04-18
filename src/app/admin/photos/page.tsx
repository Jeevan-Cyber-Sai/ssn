import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminPhotosClient from '@/components/admin/AdminPhotosClient'
import type { Profile } from '@/types/database'

export default async function AdminPhotosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  // Fetch events for this admin's org
  const { data: events } = await supabase
    .from('events')
    .select('id, title, date, location')
    .eq('event_type', profile.org)
    .order('date', { ascending: false })

  return <AdminPhotosClient profile={profile as Profile} events={events || []} />
}
