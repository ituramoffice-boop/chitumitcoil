
-- Table for tracking advisor-client sync consent
CREATE TABLE public.advisor_client_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id uuid NOT NULL,
  advisor_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  consent_granted_at timestamptz,
  revoked_at timestamptz,
  security_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_user_id, advisor_user_id)
);

-- Enable RLS
ALTER TABLE public.advisor_client_sync ENABLE ROW LEVEL SECURITY;

-- Clients can view and manage their own sync records
CREATE POLICY "Clients can view own syncs"
  ON public.advisor_client_sync FOR SELECT
  TO authenticated
  USING (client_user_id = auth.uid());

CREATE POLICY "Clients can insert own syncs"
  ON public.advisor_client_sync FOR INSERT
  TO authenticated
  WITH CHECK (client_user_id = auth.uid());

CREATE POLICY "Clients can update own syncs"
  ON public.advisor_client_sync FOR UPDATE
  TO authenticated
  USING (client_user_id = auth.uid());

-- Advisors can view syncs where they are the advisor
CREATE POLICY "Advisors can view their syncs"
  ON public.advisor_client_sync FOR SELECT
  TO authenticated
  USING (advisor_user_id = auth.uid());

-- Admin full access
CREATE POLICY "Admin full access to syncs"
  ON public.advisor_client_sync FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.advisor_client_sync;

-- Update trigger
CREATE TRIGGER update_advisor_client_sync_updated_at
  BEFORE UPDATE ON public.advisor_client_sync
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
