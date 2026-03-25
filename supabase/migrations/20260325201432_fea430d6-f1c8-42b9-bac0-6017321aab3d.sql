CREATE TABLE public.whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_number text NOT NULL,
  to_number text,
  message_body text,
  message_type text NOT NULL DEFAULT 'text',
  direction text NOT NULL DEFAULT 'inbound',
  status text NOT NULL DEFAULT 'received',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp logs"
  ON public.whatsapp_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert whatsapp logs"
  ON public.whatsapp_logs FOR INSERT TO public
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE public.whatsapp_ai_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_mode text NOT NULL DEFAULT 'consultant',
  system_context text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI config"
  ON public.whatsapp_ai_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));