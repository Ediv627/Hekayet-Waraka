
-- Add new columns to categories table
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_offer boolean NOT NULL DEFAULT false;

-- Create storage policy for category images
CREATE POLICY "Anyone can view category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = 'categories');

CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'categories'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
  )
);

CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = 'categories'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role
  )
);
