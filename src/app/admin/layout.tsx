import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import type { Profile } from '@/types/database'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin-login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/login')

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <AdminSidebar profile={profile as Profile} />
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  )
}
