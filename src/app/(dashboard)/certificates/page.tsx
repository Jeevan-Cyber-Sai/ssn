import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CertificatesClient from '@/components/dashboard/CertificatesClient'
import type { Profile } from '@/types/database'

export default async function CertificatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  const { data: certificates } = await supabase.from('certificates').select('*, event:events(*)').eq('user_id', user.id).order('issued_at', { ascending: false })

  return <CertificatesClient profile={profile as Profile} certificates={certificates || []} />
}
