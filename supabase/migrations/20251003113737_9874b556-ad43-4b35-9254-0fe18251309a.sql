-- FASE 1: Correções Críticas de Segurança

-- 1. Criar tabela consignment_items (normalizada)
CREATE TABLE IF NOT EXISTS public.consignment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consignment_id UUID NOT NULL REFERENCES public.consignments(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  remaining INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Migrar dados existentes de items (JSONB) para consignment_items
INSERT INTO public.consignment_items (consignment_id, product_name, quantity, sold, remaining)
SELECT 
  c.id as consignment_id,
  item->>'productName' as product_name,
  COALESCE((item->>'quantity')::integer, 0) as quantity,
  COALESCE((item->>'sold')::integer, 0) as sold,
  COALESCE((item->>'remaining')::integer, 0) as remaining
FROM public.consignments c
CROSS JOIN LATERAL jsonb_array_elements(c.items) as item
WHERE c.items IS NOT NULL AND jsonb_array_length(c.items) > 0;

-- 3. Remover coluna items da tabela consignments
ALTER TABLE public.consignments DROP COLUMN IF EXISTS items;

-- 4. Garantir que tenant_id não seja nulo e tenha default
ALTER TABLE public.consignments 
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT get_my_tenant_id();

-- 5. Habilitar RLS na tabela consignments
ALTER TABLE public.consignments ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para consignments
CREATE POLICY "Usuários podem acessar apenas consignações do seu tenant"
  ON public.consignments
  FOR ALL
  USING (tenant_id = get_my_tenant_id())
  WITH CHECK (tenant_id = get_my_tenant_id());

-- 7. Habilitar RLS na tabela consignment_items
ALTER TABLE public.consignment_items ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS para consignment_items (através da relação com consignments)
CREATE POLICY "Usuários podem acessar itens de consignações do seu tenant"
  ON public.consignment_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.consignments
      WHERE consignments.id = consignment_items.consignment_id
      AND consignments.tenant_id = get_my_tenant_id()
    )
  );

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_consignment_items_consignment_id 
  ON public.consignment_items(consignment_id);

CREATE INDEX IF NOT EXISTS idx_consignments_tenant_id 
  ON public.consignments(tenant_id);

CREATE INDEX IF NOT EXISTS idx_consignments_partner_id 
  ON public.consignments(partner_id);

-- 10. Adicionar trigger para atualizar status da consignação automaticamente
CREATE OR REPLACE FUNCTION update_consignment_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.consignments
  SET status = CASE
    WHEN (SELECT SUM(remaining) FROM public.consignment_items WHERE consignment_id = NEW.consignment_id) = 0 THEN 'settled'
    WHEN (SELECT SUM(sold) FROM public.consignment_items WHERE consignment_id = NEW.consignment_id) > 0 THEN 'partial'
    ELSE 'open'
  END
  WHERE id = NEW.consignment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_consignment_status
  AFTER INSERT OR UPDATE ON public.consignment_items
  FOR EACH ROW
  EXECUTE FUNCTION update_consignment_status();