-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  image TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Categories: Everyone can read
CREATE POLICY "Anyone can view categories" 
ON public.categories FOR SELECT 
USING (true);

-- Categories: Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can insert categories" 
ON public.categories FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories" 
ON public.categories FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete categories" 
ON public.categories FOR DELETE 
TO authenticated
USING (true);

-- Products: Everyone can read
CREATE POLICY "Anyone can view products" 
ON public.products FOR SELECT 
USING (true);

-- Products: Only authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can insert products" 
ON public.products FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" 
ON public.products FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete products" 
ON public.products FOR DELETE 
TO authenticated
USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Insert default categories
INSERT INTO public.categories (name) VALUES 
  ('الأقلام'),
  ('الكراسات'),
  ('الأدوات المكتبية');