import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminStudentsClient from '@/components/admin/AdminStudentsClient'
import type { Profile } from '@/types/database'

export default async function AdminStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: students } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  return <AdminStudentsClient profile={profile as Profile} students={students || []} />
}
