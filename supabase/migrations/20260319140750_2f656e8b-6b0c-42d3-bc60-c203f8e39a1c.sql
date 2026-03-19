-- Fix 1: Replace overly permissive INSERT policy on event_registrations
DROP POLICY IF EXISTS "insert_event_registrations" ON public.event_registrations;

CREATE POLICY "insert_event_registrations"
  ON public.event_registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id()
    OR profile_id = auth.uid()
  );

-- Fix 2: Secure update_overdue_transactions function with search_path
CREATE OR REPLACE FUNCTION public.update_overdue_transactions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.transactions
  SET status = 'Vencido', updated_at = now()
  WHERE status = 'Pendente' AND due_date < CURRENT_DATE;
END;
$$;

-- Restrict execution to service_role only
REVOKE EXECUTE ON FUNCTION public.update_overdue_transactions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_overdue_transactions() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_overdue_transactions() FROM anon;