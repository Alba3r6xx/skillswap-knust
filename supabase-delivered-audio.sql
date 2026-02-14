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
