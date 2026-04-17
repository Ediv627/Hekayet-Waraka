-- Drop existing permissive policies on products
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

-- Create admin-only policies for products
CREATE POLICY "Admins can insert products" 
ON public.products FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products" 
ON public.products FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products" 
ON public.products FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Also fix categories table to be admin-only
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;

CREATE POLICY "Admins can insert categories" 
ON public.categories FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories" 
ON public.categories FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories" 
ON public.categories FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));