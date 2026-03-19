
-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'tesoureiro', 'pastor', 'lider', 'user', 'parent');

-- =====================================================
-- CORE TABLES
-- =====================================================

CREATE TABLE public.churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text,
  address text,
  city text,
  state text,
  zip_code text,
  phone text,
  email text,
  website text,
  logo_url text,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text,
  type text DEFAULT 'both',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.ministries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.user_ministries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, ministry_id)
);

CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  birth_date date,
  address text,
  city text,
  state text,
  zip_code text,
  notes text,
  status text DEFAULT 'active' NOT NULL,
  member_since date,
  admission_type text,
  marital_status text,
  profession text,
  spouse_name text,
  spouse_attends_church text,
  children_names text,
  baptism_date text,
  baptism_church text,
  baptism_pastor text,
  holy_spirit_baptism text,
  previous_church text,
  previous_church_duration text,
  previous_denominations text,
  time_without_church text,
  previous_ministry text,
  previous_ministry_roles text,
  technical_skills text,
  departure_conversation boolean,
  departure_details text,
  departure_reason text,
  has_transfer_letter boolean DEFAULT false,
  transfer_letter_url text,
  wants_pastoral_visit boolean,
  leadership_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  type text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  due_date date,
  payment_date date,
  status text DEFAULT 'Pendente' NOT NULL,
  notes text,
  invoice_url text,
  origin text DEFAULT 'Manual',
  installment_number integer,
  total_installments integer,
  installment_group_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.member_ministries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'membro',
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (member_id, ministry_id)
);

CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  contribution_date date NOT NULL,
  contribution_type text NOT NULL,
  campaign_name text,
  receipt_number text,
  notes text,
  receipt_generated boolean DEFAULT false,
  receipt_generated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.ministry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'culto' NOT NULL,
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz,
  all_day boolean DEFAULT false,
  location text,
  recurring boolean DEFAULT false,
  recurrence_rule text,
  max_capacity integer,
  registration_required boolean DEFAULT false,
  ticket_price numeric DEFAULT 0,
  is_paid_event boolean DEFAULT false,
  registration_deadline timestamptz,
  cover_image_url text,
  status text DEFAULT 'published',
  visibility text DEFAULT 'members',
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  birth_date date NOT NULL,
  photo_url text,
  classroom text NOT NULL DEFAULT 'Berçário',
  allergies text,
  medications text,
  special_needs text,
  emergency_contact text,
  emergency_phone text,
  image_consent boolean DEFAULT false,
  notes text,
  status text DEFAULT 'active' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  photo_url text,
  relationship text DEFAULT 'pai/mãe' NOT NULL,
  access_pin text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.ministry_events(id) ON DELETE CASCADE NOT NULL,
  church_id uuid REFERENCES public.churches(id) ON DELETE SET NULL,
  profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  child_id uuid REFERENCES public.children(id) ON DELETE SET NULL,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE SET NULL,
  status text DEFAULT 'registered' NOT NULL,
  payment_status text DEFAULT 'free' NOT NULL,
  payment_amount numeric DEFAULT 0,
  payment_date timestamptz,
  check_in_at timestamptz,
  check_out_at timestamptz,
  ticket_number text,
  notes text,
  registered_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.child_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE CASCADE NOT NULL,
  is_primary boolean DEFAULT false,
  can_pickup boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (child_id, guardian_id)
);

CREATE TABLE public.authorized_pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  authorized_name text NOT NULL,
  authorized_phone text,
  authorized_photo text,
  relationship text,
  pickup_pin text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.pickup_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE SET NULL,
  authorized_person_name text NOT NULL,
  authorized_person_phone text,
  authorized_person_photo text,
  relationship text,
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  is_one_time boolean DEFAULT false,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.child_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  event_name text NOT NULL DEFAULT 'Culto',
  classroom text,
  label_number text,
  qr_code text NOT NULL DEFAULT gen_random_uuid()::text,
  checked_in_at timestamptz DEFAULT now() NOT NULL,
  checked_in_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_out_at timestamptz,
  checked_out_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  pickup_person_name text,
  pickup_method text DEFAULT 'guardian' NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.leader_checkout_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_in_id uuid REFERENCES public.child_check_ins(id) ON DELETE CASCADE NOT NULL,
  leader_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  reason text NOT NULL,
  pickup_person_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.child_anamnesis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  blood_type text,
  chronic_conditions text,
  previous_surgeries text,
  hospitalizations text,
  current_medications text,
  vaccination_up_to_date boolean DEFAULT true,
  vaccination_notes text,
  dietary_restrictions text,
  physical_restrictions text,
  behavioral_notes text,
  pediatrician_name text,
  pediatrician_phone text,
  health_insurance text,
  health_insurance_number text,
  photo_consent boolean DEFAULT false,
  medical_treatment_consent boolean DEFAULT false,
  emergency_transport_consent boolean DEFAULT false,
  consent_signed_by text,
  consent_signed_at timestamptz,
  last_reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (child_id, church_id)
);

CREATE TABLE public.incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  check_in_id uuid REFERENCES public.child_check_ins(id) ON DELETE SET NULL,
  incident_date date NOT NULL DEFAULT CURRENT_DATE,
  incident_time time NOT NULL DEFAULT CURRENT_TIME,
  location text,
  incident_type text NOT NULL DEFAULT 'queda',
  severity text NOT NULL DEFAULT 'leve',
  description text NOT NULL,
  immediate_action_taken text,
  first_aid_administered boolean DEFAULT false,
  first_aid_details text,
  medical_attention_required boolean DEFAULT false,
  medical_attention_details text,
  witnesses text[],
  staff_present text[],
  parent_notified_at timestamptz,
  parent_notified_by text,
  parent_response text,
  follow_up_required boolean DEFAULT false,
  follow_up_notes text,
  follow_up_completed_at timestamptz,
  reported_by text NOT NULL,
  reviewed_by text,
  reviewed_at timestamptz,
  status text DEFAULT 'aberto' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.medication_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  administration_times text[],
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  instructions text,
  requires_refrigeration boolean DEFAULT false,
  parent_authorization_date date,
  authorized_by text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES public.medication_schedules(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  administered_at timestamptz DEFAULT now() NOT NULL,
  administered_by text NOT NULL,
  dosage_given text NOT NULL,
  notes text,
  witnessed_by text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.classroom_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  classroom_name text NOT NULL,
  max_capacity integer NOT NULL DEFAULT 20,
  min_age_months integer,
  max_age_months integer,
  ratio_children_per_adult integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  classroom text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  requested_at timestamptz DEFAULT now(),
  status text DEFAULT 'waiting' NOT NULL,
  notes text,
  notified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.ministry_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  role text DEFAULT 'voluntário' NOT NULL,
  trained_classrooms text[],
  is_active boolean DEFAULT true,
  background_check_date date,
  certifications text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  staff_id uuid REFERENCES public.ministry_staff(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.ministry_events(id) ON DELETE SET NULL,
  classroom text,
  shift_start timestamptz NOT NULL,
  shift_end timestamptz NOT NULL,
  role text DEFAULT 'voluntário',
  confirmed boolean DEFAULT false,
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.department_volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  role text DEFAULT 'voluntário',
  skills text[] DEFAULT '{}',
  status text DEFAULT 'pending' NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz DEFAULT now() NOT NULL,
  term_accepted_at timestamptz,
  term_version text,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.volunteer_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE CASCADE NOT NULL,
  volunteer_id uuid REFERENCES public.department_volunteers(id) ON DELETE CASCADE NOT NULL,
  schedule_date date NOT NULL,
  shift_start time NOT NULL,
  shift_end time NOT NULL,
  schedule_type text DEFAULT 'primary',
  confirmed boolean DEFAULT false,
  confirmed_at timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.volunteer_commitment_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  title text NOT NULL DEFAULT 'Termo de Compromisso',
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE public.volunteer_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'normal',
  meeting_date timestamptz,
  is_published boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.volunteer_announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES public.volunteer_announcements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (announcement_id, user_id)
);

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  ministry_id uuid REFERENCES public.ministries(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  priority text DEFAULT 'normal',
  target_audience text DEFAULT 'all',
  target_classrooms text[] DEFAULT '{}',
  target_child_ids uuid[] DEFAULT '{}',
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  read_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (announcement_id, user_id)
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.google_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sheet_id text NOT NULL,
  sheet_name text NOT NULL,
  column_mapping jsonb DEFAULT '{}',
  access_token_enc text,
  refresh_token_enc text,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.public_sheet_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sheet_url text NOT NULL,
  sheet_id text NOT NULL,
  sheet_name text NOT NULL,
  column_mapping jsonb DEFAULT '{}',
  last_sync_at timestamptz,
  sync_status text DEFAULT 'pending',
  records_synced integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.sync_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  integration_id uuid NOT NULL,
  integration_type text DEFAULT 'google_sheets',
  records_inserted integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_skipped integer DEFAULT 0,
  status text DEFAULT 'success',
  error_message text,
  sync_type text DEFAULT 'manual',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.sheet_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  original_name text,
  status text DEFAULT 'pending',
  records_imported integer DEFAULT 0,
  error_message text,
  column_mapping jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.column_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  mapping jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  setting_key text NOT NULL,
  setting_value text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (church_id, setting_key)
);

-- View: guardians_safe
CREATE VIEW public.guardians_safe AS
SELECT id, church_id, profile_id, full_name, email, phone, photo_url, relationship, created_at, updated_at
FROM public.guardians;

-- =====================================================
-- FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.update_overdue_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.transactions SET status = 'Vencido', updated_at = now()
  WHERE status = 'Pendente' AND due_date < CURRENT_DATE;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_church_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  receipt_count integer;
BEGIN
  SELECT COUNT(*) + 1 INTO receipt_count FROM public.contributions WHERE church_id = p_church_id;
  RETURN 'RC-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(receipt_count::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_birthdays_this_month(p_church_id uuid)
RETURNS TABLE(id uuid, full_name text, birth_date date, email text, phone text)
LANGUAGE sql
STABLE
AS $$
  SELECT m.id, m.full_name, m.birth_date, m.email, m.phone
  FROM public.members m
  WHERE m.church_id = p_church_id AND m.status = 'active' AND m.birth_date IS NOT NULL
    AND EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  ORDER BY EXTRACT(DAY FROM m.birth_date);
$$;

CREATE OR REPLACE FUNCTION public.get_guardians_for_management(p_church_id uuid)
RETURNS TABLE(id uuid, church_id uuid, profile_id uuid, full_name text, email text, phone text, photo_url text, relationship text, created_at timestamptz, updated_at timestamptz, children_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT g.id, g.church_id, g.profile_id, g.full_name, g.email, g.phone, g.photo_url, g.relationship,
         g.created_at, g.updated_at, COUNT(cg.id) as children_count
  FROM public.guardians g
  LEFT JOIN public.child_guardians cg ON g.id = cg.guardian_id
  WHERE g.church_id = p_church_id
  GROUP BY g.id;
$$;

CREATE OR REPLACE FUNCTION public.get_user_church_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leader_checkout_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministry_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_commitment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_sheet_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Churches
CREATE POLICY "Users can view their church" ON public.churches FOR SELECT TO authenticated USING (id = get_user_church_id() OR owner_user_id = auth.uid());
CREATE POLICY "Users can create churches" ON public.churches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owners can update their church" ON public.churches FOR UPDATE TO authenticated USING (owner_user_id = auth.uid());

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') OR user_id = auth.uid());
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- User Ministries
CREATE POLICY "Users can view own ministries" ON public.user_ministries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage user ministries" ON public.user_ministries FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

-- Church-scoped policies
CREATE POLICY "select_categories" ON public.categories FOR SELECT TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "insert_categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (church_id = get_user_church_id());
CREATE POLICY "update_categories" ON public.categories FOR UPDATE TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "delete_categories" ON public.categories FOR DELETE TO authenticated USING (church_id = get_user_church_id());

CREATE POLICY "select_ministries" ON public.ministries FOR SELECT TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "insert_ministries" ON public.ministries FOR INSERT TO authenticated WITH CHECK (church_id = get_user_church_id());
CREATE POLICY "update_ministries" ON public.ministries FOR UPDATE TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "delete_ministries" ON public.ministries FOR DELETE TO authenticated USING (church_id = get_user_church_id());

CREATE POLICY "select_transactions" ON public.transactions FOR SELECT TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "insert_transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (church_id = get_user_church_id());
CREATE POLICY "update_transactions" ON public.transactions FOR UPDATE TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "delete_transactions" ON public.transactions FOR DELETE TO authenticated USING (church_id = get_user_church_id());

CREATE POLICY "select_members" ON public.members FOR SELECT TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "insert_members" ON public.members FOR INSERT TO authenticated WITH CHECK (church_id = get_user_church_id());
CREATE POLICY "update_members" ON public.members FOR UPDATE TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "delete_members" ON public.members FOR DELETE TO authenticated USING (church_id = get_user_church_id());

CREATE POLICY "manage_member_ministries" ON public.member_ministries FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.members m WHERE m.id = member_id AND m.church_id = get_user_church_id())
);

CREATE POLICY "select_contributions" ON public.contributions FOR SELECT TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "insert_contributions" ON public.contributions FOR INSERT TO authenticated WITH CHECK (church_id = get_user_church_id());
CREATE POLICY "update_contributions" ON public.contributions FOR UPDATE TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "delete_contributions" ON public.contributions FOR DELETE TO authenticated USING (church_id = get_user_church_id());

CREATE POLICY "select_events" ON public.ministry_events FOR SELECT TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "insert_events" ON public.ministry_events FOR INSERT TO authenticated WITH CHECK (church_id = get_user_church_id());
CREATE POLICY "update_events" ON public.ministry_events FOR UPDATE TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "delete_events" ON public.ministry_events FOR DELETE TO authenticated USING (church_id = get_user_church_id());

CREATE POLICY "select_event_registrations" ON public.event_registrations FOR SELECT TO authenticated USING (church_id = get_user_church_id() OR profile_id = auth.uid());
CREATE POLICY "insert_event_registrations" ON public.event_registrations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_event_registrations" ON public.event_registrations FOR UPDATE TO authenticated USING (profile_id = auth.uid() OR church_id = get_user_church_id());

CREATE POLICY "manage_children" ON public.children FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_guardians" ON public.guardians FOR ALL TO authenticated USING (church_id = get_user_church_id() OR profile_id = auth.uid());
CREATE POLICY "manage_child_guardians" ON public.child_guardians FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.church_id = get_user_church_id())
);
CREATE POLICY "manage_authorized_pickups" ON public.authorized_pickups FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND c.church_id = get_user_church_id())
);
CREATE POLICY "manage_pickup_authorizations" ON public.pickup_authorizations FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_child_check_ins" ON public.child_check_ins FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_leader_overrides" ON public.leader_checkout_overrides FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.child_check_ins ci WHERE ci.id = check_in_id AND ci.church_id = get_user_church_id())
);
CREATE POLICY "manage_anamnesis" ON public.child_anamnesis FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_incidents" ON public.incident_reports FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_medication_schedules" ON public.medication_schedules FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_medication_logs" ON public.medication_logs FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_classroom_settings" ON public.classroom_settings FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_waitlist" ON public.waitlist FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_ministry_staff" ON public.ministry_staff FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_staff_schedules" ON public.staff_schedules FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_dept_volunteers" ON public.department_volunteers FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_volunteer_schedules" ON public.volunteer_schedules FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_commitment_terms" ON public.volunteer_commitment_terms FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_volunteer_announcements" ON public.volunteer_announcements FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_volunteer_reads" ON public.volunteer_announcement_reads FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "manage_announcements" ON public.announcements FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_announcement_reads" ON public.announcement_reads FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "select_notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "update_notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "select_audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "insert_audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (church_id = get_user_church_id());

CREATE POLICY "manage_google_integrations" ON public.google_integrations FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "manage_public_sheet_integrations" ON public.public_sheet_integrations FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "manage_sync_history" ON public.sync_history FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_sheet_uploads" ON public.sheet_uploads FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_column_mappings" ON public.column_mappings FOR ALL TO authenticated USING (church_id = get_user_church_id());
CREATE POLICY "manage_app_settings" ON public.app_settings FOR ALL TO authenticated USING (church_id = get_user_church_id());

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('transfer-letters', 'transfer-letters', false) ON CONFLICT DO NOTHING;

CREATE POLICY "auth_upload_invoices" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'invoices');
CREATE POLICY "auth_view_invoices" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'invoices');
CREATE POLICY "auth_upload_transfer_letters" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'transfer-letters');
CREATE POLICY "auth_view_transfer_letters" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'transfer-letters');
