-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create it as a permissive policy instead
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
TO public
WITH CHECK (true);

-- Also fix order_items if it has the same issue
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

CREATE POLICY "Anyone can create order items" 
ON public.order_items 
FOR INSERT 
TO public
WITH CHECK (true);