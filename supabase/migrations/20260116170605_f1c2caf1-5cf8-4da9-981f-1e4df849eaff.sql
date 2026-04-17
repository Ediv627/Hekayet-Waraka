-- Allow anyone to read store_settings (for public display of contact info)
DROP POLICY IF EXISTS "Admins can view store settings" ON public.store_settings;

CREATE POLICY "Anyone can view store settings" 
ON public.store_settings 
FOR SELECT 
USING (true);