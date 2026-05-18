-- 1. Drop product_variants table entirely
DROP TABLE IF EXISTS public.product_variants CASCADE;

-- 2. Add short_description column to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS short_description text;

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_short_description_length;

ALTER TABLE public.products
ADD CONSTRAINT products_short_description_length
CHECK (short_description IS NULL OR char_length(short_description) <= 100);

-- 3. Seed default store_settings rows (only if not present)
INSERT INTO public.store_settings (key, value)
VALUES ('new_arrivals_count', '3')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.store_settings (key, value)
VALUES ('featured_product_enabled', 'false')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.store_settings (key, value)
VALUES ('featured_product_id', '')
ON CONFLICT (key) DO NOTHING;