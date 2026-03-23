
-- Create documents table for Smart Ingestion
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  classification TEXT DEFAULT 'unclassified',
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  consultant_id UUID,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Clients can view/upload their own documents
CREATE POLICY "Clients can view own documents"
  ON public.documents FOR SELECT TO authenticated
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Clients can insert own documents"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Clients can delete own documents"
  ON public.documents FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by);

-- Consultants can view documents of their assigned leads
CREATE POLICY "Consultants can view lead documents"
  ON public.documents FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'consultant') 
    AND consultant_id = auth.uid()
  );

-- Admin can view all documents
CREATE POLICY "Admin can view all documents"
  ON public.documents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update all documents"
  ON public.documents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for mortgage documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('mortgage-documents', 'mortgage-documents', false);

-- Storage RLS: clients can upload to their own folder
CREATE POLICY "Clients upload own docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mortgage-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Clients view own docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'mortgage-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Consultants view lead docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'mortgage-documents'
    AND public.has_role(auth.uid(), 'consultant')
  );

CREATE POLICY "Admin view all docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'mortgage-documents'
    AND public.has_role(auth.uid(), 'admin')
  );

-- Add client_user_id to leads to link leads to auth users (for document ownership)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_user_id UUID;

-- Admin can update profiles
CREATE POLICY "Admin can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
