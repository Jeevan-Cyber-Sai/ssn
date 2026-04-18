'use server'

import { createClient } from '@supabase/supabase-js'

export async function createProfileBypassRLS(profileData: any) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('YOUR_SERVICE_ROLE_KEY')) {
    // If they haven't set the service role key, we throw an error asking them to either provide it or fix the RLS in Dashboard
    throw new Error('Please add SUPABASE_SERVICE_ROLE_KEY to .env.local to automatically bypass RLS, or manually create the RLS insert policy in your Supabase dashboard.')
  }

  // Create an admin client utilizing the Service Role Key to bypass Postgres Row-Level Security
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

  const { error } = await supabaseAdmin.from('profiles').insert(profileData)

  if (error) {
    throw new Error(error.message)
  }
}
