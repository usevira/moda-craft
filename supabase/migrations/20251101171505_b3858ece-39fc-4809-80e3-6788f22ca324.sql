-- Adicionar tipos de canal de venda
DO $$ BEGIN
  CREATE TYPE sales_channel AS ENUM ('online', 'wholesale', 'event', 'store', 'consignment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar coluna de canal na tabela sales
ALTER TABLE public.sales 
  DROP COLUMN IF EXISTS type,
  ADD COLUMN IF NOT EXISTS channel sales_channel DEFAULT 'store',
  ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Criar tabela de tabelas de preço por canal
CREATE TABLE IF NOT EXISTS public.price_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid DEFAULT get_my_tenant_id(),
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  channel sales_channel NOT NULL,
  price numeric NOT NULL,
  min_quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(variant_id, channel, min_quantity)
);

-- RLS para price_tables
ALTER TABLE public.price_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view price tables from their tenant"
  ON public.price_tables FOR SELECT
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can create price tables in their tenant"
  ON public.price_tables FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can update price tables in their tenant"
  ON public.price_tables FOR UPDATE
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "Users can delete price tables in their tenant"
  ON public.price_tables FOR DELETE
  USING (tenant_id = get_my_tenant_id());

-- Adicionar índices
CREATE INDEX IF NOT EXISTS idx_price_tables_variant ON public.price_tables(variant_id);
CREATE INDEX IF NOT EXISTS idx_price_tables_channel ON public.price_tables(channel);
CREATE INDEX IF NOT EXISTS idx_sales_channel ON public.sales(channel);

COMMENT ON TABLE public.price_tables IS 'Tabelas de preços diferenciadas por canal de venda';
COMMENT ON COLUMN public.sales.channel IS 'Canal de venda: online, atacado, evento, loja ou consignação';
COMMENT ON COLUMN public.sales.commission_rate IS 'Taxa de comissão em % para este canal/venda';