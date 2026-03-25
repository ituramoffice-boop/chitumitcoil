
-- Insurance clients table
CREATE TABLE public.insurance_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  id_number text,
  birth_date date,
  city text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage own clients" ON public.insurance_clients
  FOR ALL TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Admin can manage all insurance clients" ON public.insurance_clients
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insurance policies table
CREATE TABLE public.insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  client_id uuid REFERENCES public.insurance_clients(id) ON DELETE CASCADE NOT NULL,
  policy_number text,
  policy_type text NOT NULL DEFAULT 'life',
  insurance_company text,
  start_date date,
  end_date date,
  monthly_premium numeric DEFAULT 0,
  annual_premium numeric DEFAULT 0,
  coverage_amount numeric DEFAULT 0,
  commission_rate numeric DEFAULT 0,
  commission_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage own policies" ON public.insurance_policies
  FOR ALL TO authenticated
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Admin can manage all policies" ON public.insurance_policies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_insurance_clients_updated_at
  BEFORE UPDATE ON public.insurance_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_policies_updated_at
  BEFORE UPDATE ON public.insurance_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
