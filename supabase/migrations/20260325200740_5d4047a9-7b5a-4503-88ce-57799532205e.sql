
-- Academy progress tracking table
CREATE TABLE public.academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id text NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view own progress"
  ON public.academy_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
  ON public.academy_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own progress (to undo completion)
CREATE POLICY "Users can delete own progress"
  ON public.academy_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all progress
CREATE POLICY "Admins can view all progress"
  ON public.academy_progress
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
