-- 1. Add 'delivered' column to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS delivered boolean DEFAULT false;

-- 2. Update the type CHECK constraint to allow 'audio', 'image', and 'document'
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_type_check CHECK (type IN ('text', 'resource', 'audio', 'image', 'document'));

-- 5. Reply, delete, pin columns
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_preview text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_sender_id uuid;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;

-- 6. Edit & forward columns
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS forwarded_from uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- 7. Message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- 3. Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-messages', 'audio-messages', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage policies for audio messages
CREATE POLICY "Anyone can listen to audio messages"
  ON storage.objects FOR SELECT USING (bucket_id = 'audio-messages');

CREATE POLICY "Authenticated users can upload audio"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'audio-messages' AND auth.role() = 'authenticated'
  );
