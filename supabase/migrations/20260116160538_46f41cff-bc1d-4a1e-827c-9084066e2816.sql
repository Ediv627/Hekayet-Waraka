-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create delivery_fees table for per-governorate pricing
CREATE TABLE public.delivery_fees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    governorate TEXT NOT NULL UNIQUE,
    fee NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.delivery_fees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view delivery fees"
ON public.delivery_fees
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert delivery fees"
ON public.delivery_fees
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update delivery fees"
ON public.delivery_fees
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete delivery fees"
ON public.delivery_fees
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_delivery_fees_updated_at
BEFORE UPDATE ON public.delivery_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default fees for all governorates
INSERT INTO public.delivery_fees (governorate, fee) VALUES
    ('القاهرة', 50),
    ('الإسكندرية', 60),
    ('الجيزة', 50),
    ('القليوبية', 55),
    ('الشرقية', 60),
    ('الدقهلية', 65),
    ('الغربية', 65),
    ('المنوفية', 60),
    ('البحيرة', 70),
    ('كفر الشيخ', 75),
    ('دمياط', 70),
    ('بورسعيد', 75),
    ('الإسماعيلية', 70),
    ('السويس', 70),
    ('شمال سيناء', 100),
    ('جنوب سيناء', 100),
    ('الفيوم', 70),
    ('بني سويف', 75),
    ('المنيا', 80),
    ('أسيوط', 85),
    ('سوهاج', 90),
    ('قنا', 95),
    ('الأقصر', 100),
    ('أسوان', 110),
    ('البحر الأحمر', 120),
    ('الوادي الجديد', 130),
    ('مطروح', 120);