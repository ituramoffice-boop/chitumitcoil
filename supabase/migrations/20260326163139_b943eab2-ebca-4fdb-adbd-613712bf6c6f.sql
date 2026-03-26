
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_analysis jsonb DEFAULT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payslips', 'payslips', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload payslips"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'payslips');

CREATE POLICY "Service role can read payslips"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payslips' AND auth.role() = 'service_role');
