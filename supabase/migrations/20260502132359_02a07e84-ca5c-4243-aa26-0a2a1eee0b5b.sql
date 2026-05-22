ALTER TABLE public.orders 
ADD COLUMN payment_amount_type text NOT NULL DEFAULT 'full' 
CHECK (payment_amount_type IN ('full', 'half'));