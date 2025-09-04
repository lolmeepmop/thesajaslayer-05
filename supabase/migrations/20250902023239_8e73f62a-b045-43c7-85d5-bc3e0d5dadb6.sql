-- Create play_events table for anonymous game tracking
CREATE TABLE public.play_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('game_start', 'game_end')),
  mode TEXT,
  stage TEXT,
  difficulty TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.play_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts only (no selects, updates, or deletes for privacy)
CREATE POLICY "Allow anonymous inserts only" 
ON public.play_events 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_play_events_session_event ON public.play_events(session_id, event);
CREATE INDEX idx_play_events_created_at ON public.play_events(created_at);