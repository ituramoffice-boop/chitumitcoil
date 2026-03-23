
CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  ai_summary JSONB,
  sentiment TEXT,
  action_items JSONB,
  next_step TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own call logs"
ON public.call_logs FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own call logs"
ON public.call_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_call_logs_lead_id ON public.call_logs(lead_id);
CREATE INDEX idx_call_logs_user_id ON public.call_logs(user_id);
