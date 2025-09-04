
-- 1) Remove overly permissive read access to analytics
DROP POLICY IF EXISTS "Allow authenticated reads for analytics" ON public.play_events;

-- 2) Create roles infrastructure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- No policies added to user_roles so regular users cannot modify roles.

-- 3) Helper to check roles without causing recursive RLS issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 4) Restrict analytics visibility to admins only
CREATE POLICY "Admins can read analytics"
ON public.play_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5) After you create your account, grant yourself admin by email (edit and run this separately):
-- insert into public.user_roles (user_id, role)
-- select id, 'admin'::public.app_role
-- from auth.users
-- where email = 'you@example.com'
-- on conflict (user_id, role) do nothing;
