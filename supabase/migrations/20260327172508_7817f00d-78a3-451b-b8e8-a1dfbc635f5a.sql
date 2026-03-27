-- Create swap status enum
CREATE TYPE public.swap_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

-- Volunteer availability (indisponibilidade)
CREATE TABLE public.volunteer_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES public.department_volunteers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX idx_vol_availability_volunteer ON public.volunteer_availability(volunteer_id);
CREATE INDEX idx_vol_availability_dates ON public.volunteer_availability(start_date, end_date);

ALTER TABLE public.volunteer_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_volunteer_availability" ON public.volunteer_availability
  FOR ALL TO authenticated
  USING (church_id = get_user_church_id());

-- Volunteer schedule swaps (trocas de escalas)
CREATE TABLE public.volunteer_schedule_swaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  original_schedule_id UUID NOT NULL REFERENCES public.volunteer_schedules(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.department_volunteers(id) ON DELETE CASCADE,
  target_volunteer_id UUID REFERENCES public.department_volunteers(id) ON DELETE SET NULL,
  status swap_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vol_swaps_schedule ON public.volunteer_schedule_swaps(original_schedule_id);
CREATE INDEX idx_vol_swaps_status ON public.volunteer_schedule_swaps(status);
CREATE INDEX idx_vol_swaps_requester ON public.volunteer_schedule_swaps(requester_id);

ALTER TABLE public.volunteer_schedule_swaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_volunteer_swaps" ON public.volunteer_schedule_swaps
  FOR ALL TO authenticated
  USING (church_id = get_user_church_id());

-- Function to check volunteer conflicts across ALL ministries
CREATE OR REPLACE FUNCTION public.check_volunteer_conflict(
  _volunteer_id UUID,
  _date DATE,
  _start TIME,
  _end TIME,
  _exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.volunteer_schedules vs
    WHERE vs.volunteer_id = _volunteer_id
      AND vs.schedule_date = _date
      AND vs.shift_start::time < _end
      AND vs.shift_end::time > _start
      AND (_exclude_id IS NULL OR vs.id != _exclude_id)
  )
$$;