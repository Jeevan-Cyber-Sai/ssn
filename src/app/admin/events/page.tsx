import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminEventsClient from '@/components/admin/AdminEventsClient'
import type { Profile } from '@/types/database'

export default async function AdminEventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: events } = await supabase.from('events').select('*').order('date', { ascending: false })

  return <AdminEventsClient profile={profile as Profile} initialEvents={events || []} />
}
