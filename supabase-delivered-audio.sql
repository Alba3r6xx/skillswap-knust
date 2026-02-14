-- 1. Add 'delivered' column to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS delivered boolean DEFAULT false;

-- 2. Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-messages', 'audio-messages', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for audio messages
CREATE POLICY "Anyone can listen to audio messages"
  ON storage.objects FOR SELECT USING (bucket_id = 'audio-messages');

CREATE POLICY "Authenticated users can upload audio"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'audio-messages' AND auth.role() = 'authenticated'
  );
