CREATE TYPE public.app_role AS ENUM ('employee', 'intern', 'ceo');
CREATE TABLE public.user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role public.app_role NOT NULL,
 is_demo boolean NOT NULL DEFAULT false,
 UNIQUE (user_id)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read their own access role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
COMMENT ON TABLE public.user_roles IS 'Server-managed access roles. Demo CEO accounts have no administrative privileges.';