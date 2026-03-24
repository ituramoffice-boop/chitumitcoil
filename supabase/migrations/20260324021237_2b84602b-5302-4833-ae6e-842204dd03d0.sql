
-- Add is_marketplace column to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_marketplace boolean DEFAULT false;

-- Create consultant_reviews table
CREATE TABLE public.consultant_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  reviewer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_verified boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consultant_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (public directory)
CREATE POLICY "Anyone can read reviews" ON public.consultant_reviews
  FOR SELECT TO public USING (true);

-- Only admins can insert reviews (verified via edge function or admin)
CREATE POLICY "Admin can manage reviews" ON public.consultant_reviews
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Consultants who own the lead can insert a review (after completion)
CREATE POLICY "Lead owners can insert reviews" ON public.consultant_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads
      WHERE leads.id = consultant_reviews.lead_id
        AND leads.consultant_id = auth.uid()
        AND leads.status = 'closed'
    )
  );

-- RLS for marketplace leads: allow Pro consultants to see marketplace leads
CREATE POLICY "Pro consultants can view marketplace leads" ON public.leads
  FOR SELECT TO authenticated
  USING (
    is_marketplace = true
    AND has_role(auth.uid(), 'consultant')
  );

-- Allow Pro consultants to claim marketplace leads
CREATE POLICY "Pro consultants can claim marketplace leads" ON public.leads
  FOR UPDATE TO authenticated
  USING (
    is_marketplace = true
    AND has_role(auth.uid(), 'consultant')
  )
  WITH CHECK (
    consultant_id = auth.uid()
  );
