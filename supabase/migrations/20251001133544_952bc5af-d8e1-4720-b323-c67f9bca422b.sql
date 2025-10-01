-- Create products table if not exists
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  base_cost NUMERIC DEFAULT 0,
  sale_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bill_of_materials table if not exists
CREATE TABLE IF NOT EXISTS public.bill_of_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity_required NUMERIC NOT NULL,
  UNIQUE(product_id, material_id)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_of_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all access to own tenant data" ON public.products;
DROP POLICY IF EXISTS "Allow all access to own tenant data" ON public.bill_of_materials;

-- Create RLS policies for products (temporary - allow all for development)
CREATE POLICY "Allow all access to own tenant data" ON public.products
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Create RLS policies for bill_of_materials (temporary - allow all for development)
CREATE POLICY "Allow all access to own tenant data" ON public.bill_of_materials
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);