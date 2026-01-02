-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated users can view payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated users can update payment proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Authenticated users can delete payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs');

-- Create stamps (estampas) table
CREATE TABLE public.stamps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_my_tenant_id(),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  image_url TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on stamps
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;

-- RLS Policy for stamps
CREATE POLICY "Users can access stamps from their tenant"
ON public.stamps
FOR ALL
USING (tenant_id = get_my_tenant_id())
WITH CHECK (tenant_id = get_my_tenant_id());

-- Create storage bucket for stamp images
INSERT INTO storage.buckets (id, name, public)
VALUES ('stamp-images', 'stamp-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for stamp images
CREATE POLICY "Authenticated users can upload stamp images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'stamp-images');

CREATE POLICY "Anyone can view stamp images"
ON storage.objects FOR SELECT
USING (bucket_id = 'stamp-images');

CREATE POLICY "Authenticated users can update stamp images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'stamp-images');

CREATE POLICY "Authenticated users can delete stamp images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'stamp-images');

-- Add stamp_id to products table to link products to stamps
ALTER TABLE public.products ADD COLUMN stamp_id UUID REFERENCES public.stamps(id);

-- Create index for faster lookups
CREATE INDEX idx_stamps_tenant ON public.stamps(tenant_id);
CREATE INDEX idx_products_stamp ON public.products(stamp_id);