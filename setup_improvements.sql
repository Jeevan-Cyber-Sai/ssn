-- 1. Support waitlisted status in registrations
-- PostgreSQL enum modification (if status was an enum, otherwise if it is text we just rely on application logic)
-- Assuming 'status' is TEXT based on standard Supabase setups unless explicitly defined as ENUM. 
-- If it is an ENUM, you would run: ALTER TYPE reg_status ADD VALUE IF NOT EXISTS 'waitlisted';

-- 2. Add Event Chat Media and Pins
ALTER TABLE public.event_messages ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.event_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Allow updates to event_messages (for pinning)
CREATE POLICY "Admins can update event messages." 
ON public.event_messages FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
