-- 1. Create the Event Photos table
CREATE TABLE IF NOT EXISTS public.event_photos (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security for Event Photos
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view event photos, but only admins to perform edits/inserts
CREATE POLICY "Event photos are viewable by everyone." 
ON public.event_photos FOR SELECT USING (true);

-- 2. Create the Event Messages (WhatsApp-style group) table
CREATE TABLE IF NOT EXISTS public.event_messages (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security for Event Messages
ALTER TABLE public.event_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert and view messages to make group chat work natively
CREATE POLICY "Event messages are viewable by everyone." 
ON public.event_messages FOR SELECT USING (true);

CREATE POLICY "Anyone can insert event messages." 
ON public.event_messages FOR INSERT WITH CHECK (true);

-- Important: Turn on Real-time for event_messages so the group chat feels like WhatsApp instantly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'event_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.event_messages;
    END IF;
END $$;
