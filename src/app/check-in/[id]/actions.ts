'use server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function processEventCheckIn(eventId: string, userId: string): Promise<{ success: boolean; message: string }> {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // 1. Check if the event exists and is active
  const { data: event, error: eventErr } = await supabaseAdmin.from('events').select('*').eq('id', eventId).single()
  if (eventErr || !event) return { success: false, message: 'Invalid or missing event.' }

  // 2. Check registration
  const { data: reg, error: regErr } = await supabaseAdmin.from('registrations').select('*').eq('event_id', eventId).eq('user_id', userId).single()
  if (regErr || !reg) return { success: false, message: 'You are not registered for this event. Please register first.' }

  if (reg.status === 'attended') return { success: true, message: 'You are already checked in for this event.' }

  // 3. Mark attendance
  const { error: updErr } = await supabaseAdmin
    .from('registrations')
    .update({ status: 'attended', attended_at: new Date().toISOString() })
    .eq('id', reg.id)
  if (updErr) return { success: false, message: 'Failed to update attendance status.' }

  // 4. Increment total_hours for the user
  const { data: profile } = await supabaseAdmin.from('profiles').select('total_hours').eq('id', userId).single()
  const newHours = (profile?.total_hours || 0) + (event.hours || 0)
  
  await supabaseAdmin.from('profiles').update({ total_hours: newHours }).eq('id', userId)

  return { success: true, message: `Check-in successful! You earned ${event.hours} hours.` }
}
