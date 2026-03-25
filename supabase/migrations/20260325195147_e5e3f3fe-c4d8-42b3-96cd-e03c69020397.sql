INSERT INTO storage.buckets (id, name, public)
VALUES ('academy-content', 'academy-content', true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_en text,
  description text,
  type text NOT NULL DEFAULT 'video' CHECK (type IN ('video', 'pdf', 'quiz')),
  duration text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  video_url text,
  pdf_path text,
  quiz_data jsonb,
  thumbnail_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published modules"
  ON public.academy_modules FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage modules"
  ON public.academy_modules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can read academy content"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'academy-content');

CREATE POLICY "Admins can upload academy content"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'academy-content' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete academy content"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'academy-content' AND public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_academy_modules_updated_at
  BEFORE UPDATE ON public.academy_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();