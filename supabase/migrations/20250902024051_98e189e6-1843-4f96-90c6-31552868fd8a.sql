-- Allow authenticated users to read play_events for analytics
-- This allows admin users to view analytics
CREATE POLICY "Allow authenticated reads for analytics" 
ON public.play_events 
FOR SELECT 
TO authenticated 
USING (true);