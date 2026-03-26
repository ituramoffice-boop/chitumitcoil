-- Make consultant_id nullable
ALTER TABLE public.leads ALTER COLUMN consultant_id DROP NOT NULL;

-- Update the "Landing page lead insertion" RLS policy to allow null consultant_id
DROP POLICY IF EXISTS "Landing page lead insertion" ON public.leads;
CREATE POLICY "Landing page lead insertion"
  ON public.leads
  FOR INSERT
  TO anon
  WITH CHECK (
    full_name IS NOT NULL
    AND length(full_name) > 0
    AND length(full_name) < 100
  );

-- Update the "Authenticated users can create leads via calculator" policy too
DROP POLICY IF EXISTS "Authenticated users can create leads via calculator" ON public.leads;
CREATE POLICY "Authenticated users can create leads via calculator"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    full_name IS NOT NULL
    AND length(full_name) > 0
    AND length(full_name) < 100
  );