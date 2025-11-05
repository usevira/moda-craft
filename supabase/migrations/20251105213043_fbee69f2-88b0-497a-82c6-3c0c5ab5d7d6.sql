-- Create stores table for managing multiple physical stores
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT get_my_tenant_id(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- Enable RLS on stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access stores from their tenant"
ON public.stores
FOR ALL
USING (tenant_id = get_my_tenant_id())
WITH CHECK (tenant_id = get_my_tenant_id());

-- Add store_id to inventory table
ALTER TABLE public.inventory ADD COLUMN store_id UUID REFERENCES public.stores(id);

-- Create index for better performance
CREATE INDEX idx_inventory_store_id ON public.inventory(store_id);

-- Create store_transfers table for tracking transfers between stores
CREATE TABLE public.store_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT get_my_tenant_id(),
  from_store_id UUID REFERENCES public.stores(id),
  to_store_id UUID NOT NULL REFERENCES public.stores(id),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  initiated_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT different_stores CHECK (from_store_id IS NULL OR from_store_id != to_store_id)
);

-- Enable RLS on store_transfers
ALTER TABLE public.store_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access transfers from their tenant"
ON public.store_transfers
FOR ALL
USING (tenant_id = get_my_tenant_id())
WITH CHECK (tenant_id = get_my_tenant_id());

-- Create stock_reservations table
CREATE TABLE public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT get_my_tenant_id(),
  inventory_id UUID NOT NULL REFERENCES public.inventory(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reserved_by UUID REFERENCES auth.users(id),
  reference_type TEXT,
  reference_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired', 'cancelled')),
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on stock_reservations
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access reservations from their tenant"
ON public.stock_reservations
FOR ALL
USING (tenant_id = get_my_tenant_id())
WITH CHECK (tenant_id = get_my_tenant_id());

-- Create index for better performance
CREATE INDEX idx_stock_reservations_inventory ON public.stock_reservations(inventory_id);
CREATE INDEX idx_stock_reservations_status ON public.stock_reservations(status);
CREATE INDEX idx_stock_reservations_expires_at ON public.stock_reservations(expires_at);

-- Function to get available stock (quantity - active reservations)
CREATE OR REPLACE FUNCTION public.get_available_stock(p_inventory_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT quantity FROM inventory WHERE id = p_inventory_id) - 
    (SELECT COALESCE(SUM(quantity), 0) 
     FROM stock_reservations 
     WHERE inventory_id = p_inventory_id 
       AND status = 'active' 
       AND expires_at > now()),
    0
  );
$$;

-- Function to expire old reservations
CREATE OR REPLACE FUNCTION public.expire_stock_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE stock_reservations
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at <= now();
END;
$$;

-- View for inventory with availability
CREATE OR REPLACE VIEW public.v_inventory_availability AS
SELECT 
  i.*,
  COALESCE(SUM(CASE WHEN sr.status = 'active' AND sr.expires_at > now() THEN sr.quantity ELSE 0 END), 0) as reserved_quantity,
  i.quantity - COALESCE(SUM(CASE WHEN sr.status = 'active' AND sr.expires_at > now() THEN sr.quantity ELSE 0 END), 0) as available_quantity,
  s.name as store_name,
  s.code as store_code
FROM inventory i
LEFT JOIN stock_reservations sr ON i.id = sr.inventory_id
LEFT JOIN stores s ON i.store_id = s.id
GROUP BY i.id, s.name, s.code;

-- View for consolidated inventory across stores
CREATE OR REPLACE VIEW public.v_consolidated_inventory AS
SELECT 
  i.tenant_id,
  i.product_id,
  i.product_style,
  i.color,
  i.size,
  i.inventory_type,
  COUNT(DISTINCT i.store_id) as stores_count,
  SUM(i.quantity) as total_quantity,
  SUM(i.quantity - COALESCE(sr.reserved, 0)) as total_available,
  SUM(COALESCE(sr.reserved, 0)) as total_reserved,
  i.min_stock,
  i.max_stock
FROM inventory i
LEFT JOIN (
  SELECT inventory_id, SUM(quantity) as reserved
  FROM stock_reservations
  WHERE status = 'active' AND expires_at > now()
  GROUP BY inventory_id
) sr ON i.id = sr.inventory_id
GROUP BY 
  i.tenant_id, i.product_id, i.product_style, 
  i.color, i.size, i.inventory_type, i.min_stock, i.max_stock;