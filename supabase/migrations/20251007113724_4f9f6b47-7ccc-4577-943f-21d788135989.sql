-- FASE 5: Sistema Completo de Controle de Estoque para Camisetas
-- Prioridades Urgentes: 1, 2, 3 e 4

-- ============================================================================
-- PRIORIDADE 1 & 2: Diferenciar tipos de estoque e estilos de produto
-- ============================================================================

-- Criar ENUMs para tipos de estoque, estilos e tipos de materiais
CREATE TYPE public.inventory_type AS ENUM ('raw_material', 'finished_product');
CREATE TYPE public.product_style AS ENUM ('T-Shirt', 'Oversized');
CREATE TYPE public.material_type AS ENUM ('blank_shirt', 'ink', 'packaging', 'supply');

-- Adicionar colunas à tabela inventory
ALTER TABLE public.inventory
ADD COLUMN inventory_type public.inventory_type DEFAULT 'finished_product',
ADD COLUMN product_style public.product_style,
ADD COLUMN location text,
ADD COLUMN warehouse_section text,
ADD COLUMN min_stock integer DEFAULT 5,
ADD COLUMN max_stock integer;

-- Adicionar coluna style à tabela products
ALTER TABLE public.products
ADD COLUMN style public.product_style;

-- Adicionar colunas à tabela materials
ALTER TABLE public.materials
ADD COLUMN material_type public.material_type DEFAULT 'supply',
ADD COLUMN shirt_style public.product_style;

-- ============================================================================
-- PRIORIDADE 3: Sistema de Variantes de Produto
-- ============================================================================

-- Criar tabela de variantes de produto
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  sku_variant text NOT NULL UNIQUE,
  style public.product_style NOT NULL,
  color text NOT NULL,
  size text NOT NULL,
  additional_cost numeric DEFAULT 0,
  tenant_id uuid DEFAULT get_my_tenant_id(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, style, color, size)
);

-- Habilitar RLS na tabela product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para product_variants
CREATE POLICY "Users can view variants from their tenant"
ON public.product_variants
FOR SELECT
USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can create variants in their tenant"
ON public.product_variants
FOR INSERT
WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can update variants in their tenant"
ON public.product_variants
FOR UPDATE
USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Only admins can delete variants"
ON public.product_variants
FOR DELETE
USING (tenant_id = get_my_tenant_id() AND has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PRIORIDADE 4: Documentar Movimentações de Estoque
-- ============================================================================

-- Criar ENUM para tipos de movimentação
CREATE TYPE public.movement_type AS ENUM (
  'purchase',
  'production',
  'sale',
  'consignment_out',
  'consignment_return',
  'adjustment',
  'loss',
  'transfer'
);

-- Criar tabela de movimentações de estoque
CREATE TABLE public.inventory_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movement_type public.movement_type NOT NULL,
  inventory_id uuid REFERENCES public.inventory(id),
  product_id uuid REFERENCES public.products(id),
  variant_id uuid REFERENCES public.product_variants(id),
  quantity integer NOT NULL,
  quantity_before integer,
  quantity_after integer,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  tenant_id uuid DEFAULT get_my_tenant_id(),
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela inventory_movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para inventory_movements
CREATE POLICY "Users can view movements from their tenant"
ON public.inventory_movements
FOR SELECT
USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can create movements in their tenant"
ON public.inventory_movements
FOR INSERT
WITH CHECK (tenant_id = get_my_tenant_id());

-- ============================================================================
-- MELHORIAS ADICIONAIS: Rastreabilidade de Lotes
-- ============================================================================

-- Adicionar colunas à tabela batches para rastreabilidade
ALTER TABLE public.batches
ADD COLUMN batch_number text UNIQUE,
ADD COLUMN expiration_date date,
ADD COLUMN supplier_batch_ref text,
ADD COLUMN style public.product_style;

-- Criar função para gerar número de lote automático
CREATE OR REPLACE FUNCTION public.generate_batch_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_batch_number text;
  batch_count integer;
BEGIN
  SELECT COUNT(*) INTO batch_count
  FROM batches
  WHERE tenant_id = get_my_tenant_id()
  AND created_at >= date_trunc('year', now());
  
  new_batch_number := 'LOTE-' || to_char(now(), 'YYYY') || '-' || LPAD((batch_count + 1)::text, 4, '0');
  
  RETURN new_batch_number;
END;
$$;

-- Trigger para gerar batch_number automaticamente
CREATE OR REPLACE FUNCTION public.set_batch_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.batch_number IS NULL THEN
    NEW.batch_number := generate_batch_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_batch_number_trigger
BEFORE INSERT ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.set_batch_number();

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View para estoque de matérias-primas (camisetas lisas)
CREATE OR REPLACE VIEW public.v_raw_materials_stock AS
SELECT 
  i.id,
  i.product_id,
  p.name as product_name,
  i.color,
  i.size,
  i.product_style,
  i.quantity,
  i.min_stock,
  i.location,
  i.warehouse_section,
  i.tenant_id,
  CASE 
    WHEN i.quantity = 0 THEN 'out_of_stock'
    WHEN i.quantity <= i.min_stock THEN 'low_stock'
    ELSE 'normal'
  END as stock_status
FROM public.inventory i
LEFT JOIN public.products p ON i.product_id = p.id
WHERE i.inventory_type = 'raw_material';

-- View para estoque de produtos acabados
CREATE OR REPLACE VIEW public.v_finished_products_stock AS
SELECT 
  i.id,
  i.product_id,
  p.name as product_name,
  p.style as product_style,
  i.color,
  i.size,
  i.quantity,
  i.min_stock,
  i.location,
  i.warehouse_section,
  p.sale_price,
  (i.quantity * p.sale_price) as total_value,
  i.tenant_id,
  CASE 
    WHEN i.quantity = 0 THEN 'out_of_stock'
    WHEN i.quantity <= i.min_stock THEN 'low_stock'
    ELSE 'normal'
  END as stock_status
FROM public.inventory i
LEFT JOIN public.products p ON i.product_id = p.id
WHERE i.inventory_type = 'finished_product';

-- View para alertas de estoque baixo
CREATE OR REPLACE VIEW public.v_low_stock_alerts AS
SELECT 
  i.id,
  i.inventory_type,
  p.name as product_name,
  i.color,
  i.size,
  i.product_style,
  i.quantity,
  i.min_stock,
  i.location,
  i.tenant_id
FROM public.inventory i
LEFT JOIN public.products p ON i.product_id = p.id
WHERE i.quantity <= i.min_stock
ORDER BY i.quantity ASC;