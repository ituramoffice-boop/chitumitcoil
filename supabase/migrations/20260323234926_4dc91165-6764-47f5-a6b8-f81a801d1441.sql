
-- Client cases: the core table for managing active client files
CREATE TABLE public.client_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  consultant_id text NOT NULL,
  status text NOT NULL DEFAULT 'intake',
  current_stage text NOT NULL DEFAULT 'document_collection',
  stages_completed text[] DEFAULT '{}',
  target_close_date date,
  notes_internal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Case checklist items
CREATE TABLE public.case_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.client_cases(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  is_completed boolean DEFAULT false,
  is_critical boolean DEFAULT false,
  completed_at timestamptz,
  due_date date,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Case reminders / follow-ups
CREATE TABLE public.case_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.client_cases(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  remind_at timestamptz NOT NULL,
  is_done boolean DEFAULT false,
  reminder_type text DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Case timeline events
CREATE TABLE public.case_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.client_cases(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_timeline ENABLE ROW LEVEL SECURITY;

-- RLS policies: consultants access their own cases
CREATE POLICY "Consultants manage own cases" ON public.client_cases
  FOR ALL TO authenticated
  USING (consultant_id = auth.uid()::text)
  WITH CHECK (consultant_id = auth.uid()::text);

CREATE POLICY "Access checklist via case" ON public.case_checklist
  FOR ALL TO authenticated
  USING (case_id IN (SELECT id FROM public.client_cases WHERE consultant_id = auth.uid()::text))
  WITH CHECK (case_id IN (SELECT id FROM public.client_cases WHERE consultant_id = auth.uid()::text));

CREATE POLICY "Access reminders via case" ON public.case_reminders
  FOR ALL TO authenticated
  USING (case_id IN (SELECT id FROM public.client_cases WHERE consultant_id = auth.uid()::text))
  WITH CHECK (case_id IN (SELECT id FROM public.client_cases WHERE consultant_id = auth.uid()::text));

CREATE POLICY "Access timeline via case" ON public.case_timeline
  FOR ALL TO authenticated
  USING (case_id IN (SELECT id FROM public.client_cases WHERE consultant_id = auth.uid()::text))
  WITH CHECK (case_id IN (SELECT id FROM public.client_cases WHERE consultant_id = auth.uid()::text));
