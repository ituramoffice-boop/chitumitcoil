
-- Add consultant branding & plan fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text,
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS lead_count integer NOT NULL DEFAULT 0;

-- Allow anon to read consultant profile for branding on calculator pages
CREATE POLICY "Public can read consultant branding"
  ON public.profiles FOR SELECT
  USING (true);
