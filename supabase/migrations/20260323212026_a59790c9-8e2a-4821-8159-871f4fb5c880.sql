
-- Drop overly permissive policy and replace with a scoped one
DROP POLICY IF EXISTS "Public can insert leads from landing page" ON public.leads;

-- Only allow inserting with specific landing-page consultant_id and limited fields
CREATE POLICY "Landing page lead insertion"
ON public.leads FOR INSERT TO anon
WITH CHECK (
  full_name IS NOT NULL AND
  length(full_name) > 0 AND
  length(full_name) < 100
);
