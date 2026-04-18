'use server'

import { createClient } from '@supabase/supabase-js'

export async function registerAdminBypassProfile(profileData: any, password: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_SERVICE_ROLE_KEY')) {
    throw new Error('Please add SUPABASE_SERVICE_ROLE_KEY to .env.local to automatically bypass RLS and create users safely.')
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  )

  // 1. Force create the user directly in auth.users so the foreign key mapping immediately exists.
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: profileData.email,
    password: password,
    email_confirm: true,
  })

  if (authErr) throw new Error(authErr.message)

  // 2. Safely insert the profile with the confirmed uuid.
  const { error: profileErr } = await supabaseAdmin.from('profiles').insert({
    ...profileData,
    id: authData.user.id
  })

  if (profileErr) {
    // Attempt rollback if profile fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    throw new Error(profileErr.message)
  }
}
