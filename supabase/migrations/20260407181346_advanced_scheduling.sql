-- Create family links table
CREATE TABLE public.family_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  profile_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL, -- e.g. 'spouse', 'child', 'parent', 'sibling'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_profiles CHECK (profile_id_1 != profile_id_2)
);

CREATE INDEX idx_family_links_church ON public.family_links(church_id);
CREATE INDEX idx_family_links_p1 ON public.family_links(profile_id_1);
CREATE INDEX idx_family_links_p2 ON public.family_links(profile_id_2);

ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_family_links" ON public.family_links
  FOR ALL TO authenticated
  USING (church_id = get_user_church_id());

-- Advanced conflict checker
CREATE OR REPLACE FUNCTION public.check_volunteer_conflict_advanced(
  _volunteer_id UUID,
  _date DATE,
  _start TIME,
  _end TIME,
  _exclude_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_profile_id UUID;
  has_conflict BOOLEAN;
  has_vacation BOOLEAN;
  family_conflict_id UUID;
  family_relations JSONB;
BEGIN
  -- We need the actual profile_id of the volunteer from department_volunteers
  SELECT profile_id INTO v_profile_id FROM public.department_volunteers WHERE id = _volunteer_id;

  -- 1. Check direct schedule conflict
  SELECT EXISTS (
    SELECT 1
    FROM public.volunteer_schedules vs
    WHERE vs.volunteer_id = _volunteer_id
      AND vs.schedule_date = _date
      AND vs.shift_start::time < _end
      AND vs.shift_end::time > _start
      AND (_exclude_id IS NULL OR vs.id != _exclude_id)
  ) INTO has_conflict;

  -- 2. Check vacation / availability
  SELECT EXISTS (
    SELECT 1
    FROM public.volunteer_availability va
    WHERE va.volunteer_id = _volunteer_id
      AND va.start_date <= _date
      AND va.end_date >= _date
  ) INTO has_vacation;

  -- 3. Check family conflicts (is any family member scheduled during this shift?)
  -- Get all family profile IDs for this person
  SELECT jsonb_agg(
    jsonb_build_object(
      'profile_id', CASE WHEN profile_id_1 = v_profile_id THEN profile_id_2 ELSE profile_id_1 END,
      'relation', relation_type
    )
  ) INTO family_relations
  FROM public.family_links
  WHERE profile_id_1 = v_profile_id OR profile_id_2 = v_profile_id;

  IF family_relations IS NOT NULL THEN
    SELECT vs.id INTO family_conflict_id
    FROM public.volunteer_schedules vs
    JOIN public.department_volunteers dv ON dv.id = vs.volunteer_id
    WHERE dv.profile_id IN (
      SELECT (elem->>'profile_id')::UUID FROM jsonb_array_elements(family_relations) elem
    )
    AND vs.schedule_date = _date
    AND vs.shift_start::time < _end
    AND vs.shift_end::time > _start
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'has_conflict', has_conflict,
    'has_vacation', has_vacation,
    'family_conflict', family_conflict_id IS NOT NULL,
    'family_relations', COALESCE(family_relations, '[]'::jsonb)
  );
END;
$$;

-- Trigger to handle vacation assignment logic
CREATE OR REPLACE FUNCTION public.trg_vacation_conflict() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Mark conflicting schedules as unconfirmed and add note
  UPDATE public.volunteer_schedules
  SET confirmed = false,
      notes = CONCAT('⚠️ ALERTA DE FÉRIAS/AUSÊNCIA: ', COALESCE(notes, ''))
  WHERE volunteer_id = NEW.volunteer_id
    AND schedule_date >= NEW.start_date
    AND schedule_date <= NEW.end_date;
    
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_vacation_inserted
AFTER INSERT OR UPDATE ON public.volunteer_availability
FOR EACH ROW
EXECUTE FUNCTION public.trg_vacation_conflict();
