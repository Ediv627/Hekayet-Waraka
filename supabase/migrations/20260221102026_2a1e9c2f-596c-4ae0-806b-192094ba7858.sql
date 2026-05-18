
-- Create sub-areas table for multi-level delivery fees
CREATE TABLE public.delivery_sub_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  governorate TEXT NOT NULL,
  area_name TEXT NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_sub_areas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view delivery sub areas" ON public.delivery_sub_areas FOR SELECT USING (true);
CREATE POLICY "Admins can insert delivery sub areas" ON public.delivery_sub_areas FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update delivery sub areas" ON public.delivery_sub_areas FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete delivery sub areas" ON public.delivery_sub_areas FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_delivery_sub_areas_updated_at
  BEFORE UPDATE ON public.delivery_sub_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data for كفر الشيخ
INSERT INTO public.delivery_sub_areas (governorate, area_name, fee) VALUES
  ('كفر الشيخ', 'مدينة بيلا', 25),
  ('كفر الشيخ', 'حول مدينة بيلا', 35);
