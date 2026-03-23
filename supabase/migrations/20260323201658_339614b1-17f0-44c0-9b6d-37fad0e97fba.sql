ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'organic',
  ADD COLUMN IF NOT EXISTS last_contact timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS next_step text DEFAULT NULL;