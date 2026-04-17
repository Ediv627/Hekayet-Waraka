-- Fix store_settings exposure: restrict SELECT to admins only
DROP POLICY IF EXISTS "Anyone can view store settings" ON public.store_settings;

CREATE POLICY "Admins can view store settings"
ON public.store_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create rate_limit_log table for IP-based rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_time ON public.rate_limit_log(identifier, created_at);

-- Enable RLS on rate_limit_log
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

-- No public access needed - service role will manage this table