
-- Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage team" ON public.teams
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admin can manage all teams" ON public.teams
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Team members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  department text DEFAULT 'sales',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team owner can manage members" ON public.team_members
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid())
  );

CREATE POLICY "Members can view own team" ON public.team_members
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all members" ON public.team_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add assigned_to column to leads for team assignment
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to uuid;
