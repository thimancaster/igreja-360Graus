-- Fix security definer view: guardians_safe
-- Recreate as SECURITY INVOKER (default) view
DROP VIEW IF EXISTS public.guardians_safe;
CREATE VIEW public.guardians_safe AS
  SELECT id, church_id, profile_id, full_name, email, phone, photo_url, relationship, cpf, created_at, updated_at
  FROM public.guardians;