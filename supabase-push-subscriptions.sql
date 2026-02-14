-- Push Subscriptions table for Web Push notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can manage own push subscription"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Allow service role to read any subscription (for sending notifications)
CREATE POLICY "Service role can read all subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (true);

-- Enable full replica identity for realtime (for messages read receipts)
-- Run this if you haven't already:
-- ALTER TABLE public.messages REPLICA IDENTITY FULL;
