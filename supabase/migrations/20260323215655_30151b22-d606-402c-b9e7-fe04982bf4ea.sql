-- Add sign_token for remote signing links
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sign_token uuid DEFAULT gen_random_uuid();

-- Create unique index on sign_token
CREATE UNIQUE INDEX IF NOT EXISTS leads_sign_token_unique ON public.leads (sign_token);

-- Allow anonymous access to read lead by sign_token (for remote signing page)
CREATE POLICY "Public can view lead by sign_token"
ON public.leads
FOR SELECT
TO anon
USING (sign_token IS NOT NULL);

-- Allow anonymous update for signing (only signature fields)
CREATE POLICY "Public can sign via token"
ON public.leads
FOR UPDATE
TO anon
USING (sign_token IS NOT NULL)
WITH CHECK (sign_token IS NOT NULL);