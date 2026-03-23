
-- Add signature fields to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS signature_url TEXT DEFAULT NULL;

-- Create storage bucket for signed documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('signed-documents', 'signed-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: authenticated users can upload signed documents
CREATE POLICY "Authenticated users can upload signed docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'signed-documents');

-- RLS policy: anyone can read signed documents (public bucket)
CREATE POLICY "Public can read signed docs"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'signed-documents');

-- RLS policy: authenticated users can delete their signed docs
CREATE POLICY "Authenticated users can delete signed docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'signed-documents');
