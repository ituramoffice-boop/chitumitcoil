CREATE POLICY "Authenticated users can create leads via calculator"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  full_name IS NOT NULL 
  AND length(full_name) > 0 
  AND length(full_name) < 100 
  AND consultant_id IS NOT NULL
);