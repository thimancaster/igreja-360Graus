-- Insert the missing profile for the master admin
INSERT INTO public.profiles (id, full_name, church_id)
VALUES (
  '623e174f-732a-4cae-bf6f-712e5eb4b58d',
  'Thiago Vinicius Ferreira',
  'adfed402-dbe9-4793-8fbf-6df8b9ce6240'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  church_id = EXCLUDED.church_id;

-- Recreate the trigger for auto-creating profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure admin role exists for this user
INSERT INTO public.user_roles (user_id, role)
VALUES ('623e174f-732a-4cae-bf6f-712e5eb4b58d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;