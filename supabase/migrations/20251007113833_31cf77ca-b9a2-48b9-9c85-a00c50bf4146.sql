-- Corrigir avisos de segurança das views criadas na FASE 5

-- Recriar view para estoque de matérias-primas sem SECURITY DEFINER
DROP VIEW IF EXISTS public.v_raw_materials_stock;
CREATE VIEW public.v_raw_materials_stock AS
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

-- Recriar view para estoque de produtos acabados sem SECURITY DEFINER
DROP VIEW IF EXISTS public.v_finished_products_stock;
CREATE VIEW public.v_finished_products_stock AS
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

-- Recriar view para alertas de estoque baixo sem SECURITY DEFINER
DROP VIEW IF EXISTS public.v_low_stock_alerts;
CREATE VIEW public.v_low_stock_alerts AS
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