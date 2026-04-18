import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminAttendanceClient from '@/components/admin/AdminAttendanceClient'
import type { Profile } from '@/types/database'

export default async function AdminAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  // Fetch past + ongoing events (already happened)
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .lte('date', new Date().toISOString())
    .eq('is_active', true)
    .order('date', { ascending: false })
    .limit(30)

  return <AdminAttendanceClient profile={profile as Profile} events={events || []} />
}
