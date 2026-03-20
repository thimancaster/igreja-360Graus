
-- Add banking and YouTube fields to churches
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS pix_key text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS pix_key_type text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS bank_agency text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS bank_account text;
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS youtube_live_url text;

-- Create pastoral_appointments table
CREATE TABLE public.pastoral_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  member_profile_id uuid NOT NULL,
  pastor_name text NOT NULL,
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pastoral_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_appointments" ON public.pastoral_appointments
  FOR ALL TO authenticated
  USING (church_id = get_user_church_id() OR member_profile_id = auth.uid())
  WITH CHECK (church_id = get_user_church_id() OR member_profile_id = auth.uid());
