-- Google Play Billing launch support.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS purchase_token text,
  ADD COLUMN IF NOT EXISTS package_name text,
  ADD COLUMN IF NOT EXISTS auto_renewing boolean,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_purchase_token
  ON public.subscriptions(purchase_token)
  WHERE purchase_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_expires
  ON public.subscriptions(user_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_product_id
  ON public.subscriptions(product_id);

CREATE OR REPLACE FUNCTION public.generation_limit_for_plan(plan_raw text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN plan_raw IS NULL OR trim(lower(plan_raw)) IN ('', 'free') THEN 0
    WHEN trim(lower(plan_raw)) IN ('basic', 'student', 'semester', 'pro_weekly') THEN 10
    WHEN trim(lower(plan_raw)) IN ('pro', 'yearly') THEN 30
    WHEN trim(lower(plan_raw)) IN ('unlimited', 'lifetime') THEN 50
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_user_plan_for_generation(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub_plan text;
BEGIN
  SELECT NULLIF(trim(s.plan), '') INTO v_sub_plan
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND lower(COALESCE(s.status, '')) IN ('active', 'trialing', 'in_grace_period', 'canceled')
    AND (s.expires_at IS NULL OR s.expires_at > now())
  ORDER BY s.expires_at DESC NULLS LAST
  LIMIT 1;

  RETURN COALESCE(v_sub_plan, 'free');
END;
$$;

CREATE OR REPLACE FUNCTION public.auth_user_has_premium()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = auth.uid()
      AND lower(COALESCE(s.status, '')) IN ('active', 'trialing', 'in_grace_period', 'canceled')
      AND lower(COALESCE(s.plan, '')) NOT IN ('', 'free')
      AND (s.expires_at IS NULL OR s.expires_at > now())
  );
$$;

REVOKE ALL ON FUNCTION public.generation_limit_for_plan(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_user_plan_for_generation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auth_user_has_premium() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_has_premium() TO authenticated;
