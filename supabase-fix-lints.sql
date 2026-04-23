-- Fix: security_definer_view on public.user_dashboard_data
ALTER VIEW IF EXISTS public.user_dashboard_data SET (security_invoker = on);

-- Fix: security_definer_view on public.user_points_dashboard
ALTER VIEW IF EXISTS public.user_points_dashboard SET (security_invoker = on);

-- Fix: rls_disabled_in_public on public.subscription_plans
ALTER TABLE IF EXISTS public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Apply a secure policy to subscription_plans so the application can still read it if necessary
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
    FOR SELECT USING (true);

-- Fix: function_search_path_mutable
-- Dynamically sets the search_path for all functions in the public schema 
-- to prevent search path injection attacks.
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT oid::regprocedure::text AS sig
        FROM pg_proc
        WHERE pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'ALTER FUNCTION ' || func_record.sig || ' SET search_path = '';''';
    END LOOP;
END;
$$;
