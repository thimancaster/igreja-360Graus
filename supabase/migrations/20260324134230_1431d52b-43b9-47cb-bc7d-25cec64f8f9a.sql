-- Fix security definer view with explicit security_invoker
DROP VIEW IF EXISTS public.guardians_safe;
CREATE VIEW public.guardians_safe
  WITH (security_invoker = true)
AS
  SELECT id, church_id, profile_id, full_name, email, phone, photo_url, relationship, cpf, created_at, updated_at
  FROM public.guardians;