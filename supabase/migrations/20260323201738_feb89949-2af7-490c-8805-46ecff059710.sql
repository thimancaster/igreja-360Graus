-- 1. Fix "Users can create churches" RLS policy (always true -> must be owner)
DROP POLICY IF EXISTS "Users can create churches" ON public.churches;
CREATE POLICY "Users can create churches" ON public.churches
  FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

-- 2. Fix search_path on functions missing it
CREATE OR REPLACE FUNCTION public.generate_receipt_number(p_church_id uuid)
  RETURNS text
  LANGUAGE plpgsql
  STABLE
  SECURITY INVOKER
  SET search_path = 'public'
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
  SECURITY INVOKER
  SET search_path = 'public'
AS $$
  SELECT m.id, m.full_name, m.birth_date, m.email, m.phone
  FROM public.members m
  WHERE m.church_id = p_church_id AND m.status = 'active' AND m.birth_date IS NOT NULL
    AND EXTRACT(MONTH FROM m.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
  ORDER BY EXTRACT(DAY FROM m.birth_date);
$$;

CREATE OR REPLACE FUNCTION public.get_guardians_for_management(p_church_id uuid)
  RETURNS TABLE(id uuid, church_id uuid, profile_id uuid, full_name text, email text, phone text, photo_url text, relationship text, cpf text, created_at timestamp with time zone, updated_at timestamp with time zone, children_count bigint)
  LANGUAGE sql
  STABLE
  SECURITY INVOKER
  SET search_path = 'public'
AS $$
  SELECT g.id, g.church_id, g.profile_id, g.full_name, g.email, g.phone, g.photo_url, g.relationship, g.cpf,
         g.created_at, g.updated_at, COUNT(cg.id) as children_count
  FROM public.guardians g
  LEFT JOIN public.child_guardians cg ON g.id = cg.guardian_id
  WHERE g.church_id = p_church_id
  GROUP BY g.id;
$$;

-- 3. Scope update_overdue_transactions RPC to caller's church
CREATE OR REPLACE FUNCTION public.update_overdue_transactions()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.transactions
  SET status = 'Vencido', updated_at = now()
  WHERE status = 'Pendente' 
    AND due_date < CURRENT_DATE
    AND church_id = get_user_church_id();
END;
$$;