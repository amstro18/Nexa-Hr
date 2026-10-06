import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export type AccessRole = 'employee' | 'intern' | 'hr' | 'ceo';

export const getMyAccess = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('user_roles')
      .select('role, is_demo')
      .eq('user_id', context.userId)
      .maybeSingle();
    if (error) throw new Error('Your access details could not be loaded. Please try again.');
    return { role: data?.role ?? 'employee', isDemo: data?.is_demo ?? false };
  });