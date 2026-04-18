import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminCertificatesClient from '@/components/admin/AdminCertificatesClient'
import type { Profile } from '@/types/database'

export default async function AdminCertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  // Fetch events for this admin's org to populate dropdown
  const { data: events } = await supabase
    .from('events')
    .select('*, registrations(user_id, status, profile:profiles(name, org))')
    .eq('event_type', profile.org)
    .order('date', { ascending: false })

  return <AdminCertificatesClient profile={profile as Profile} events={events || []} />
}
