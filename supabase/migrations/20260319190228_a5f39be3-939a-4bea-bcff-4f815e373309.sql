
-- Add CPF column to guardians
ALTER TABLE public.guardians ADD COLUMN cpf text;

-- Unique index: no duplicate CPF per church
CREATE UNIQUE INDEX guardians_cpf_church_unique ON public.guardians (church_id, cpf) WHERE cpf IS NOT NULL AND cpf != '';

-- Recreate guardians_safe view to include cpf
DROP VIEW IF EXISTS public.guardians_safe;
CREATE VIEW public.guardians_safe AS
SELECT id, church_id, profile_id, full_name, email, phone, photo_url, relationship, cpf, created_at, updated_at
FROM public.guardians;

-- Drop and recreate function with new signature
DROP FUNCTION IF EXISTS public.get_guardians_for_management(uuid);

CREATE FUNCTION public.get_guardians_for_management(p_church_id uuid)
RETURNS TABLE(id uuid, church_id uuid, profile_id uuid, full_name text, email text, phone text, photo_url text, relationship text, cpf text, created_at timestamp with time zone, updated_at timestamp with time zone, children_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT g.id, g.church_id, g.profile_id, g.full_name, g.email, g.phone, g.photo_url, g.relationship, g.cpf,
         g.created_at, g.updated_at, COUNT(cg.id) as children_count
  FROM public.guardians g
  LEFT JOIN public.child_guardians cg ON g.id = cg.guardian_id
  WHERE g.church_id = p_church_id
  GROUP BY g.id;
$$;
