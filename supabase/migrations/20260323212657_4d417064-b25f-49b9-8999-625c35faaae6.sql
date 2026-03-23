
DROP POLICY IF EXISTS "Landing page lead insertion" ON public.leads;

CREATE POLICY "Landing page lead insertion"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (
  full_name IS NOT NULL
  AND length(full_name) > 0
  AND length(full_name) < 100
  AND consultant_id IS NOT NULL
);
