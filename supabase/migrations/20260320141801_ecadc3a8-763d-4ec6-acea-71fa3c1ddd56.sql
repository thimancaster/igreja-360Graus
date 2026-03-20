
CREATE TABLE public.classroom_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  classroom text NOT NULL,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  event_name text,
  title text NOT NULL,
  content text NOT NULL,
  teacher_name text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classroom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_classroom_reports" ON public.classroom_reports
  FOR ALL TO authenticated
  USING (church_id = get_user_church_id());
