
-- Allow anonymous/public lead insertion for landing page
CREATE POLICY "Public can insert leads from landing page"
ON public.leads FOR INSERT TO anon
WITH CHECK (true);
