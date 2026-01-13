-- 1. Add DRE classification columns to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS dre_category text CHECK (dre_category IN ('sales', 'operational_cost', 'cogs')),
ADD COLUMN IF NOT EXISTS cash_impact boolean DEFAULT true;

-- 2. Add divergence tracking to event_stock_allocations
ALTER TABLE public.event_stock_allocations
ADD COLUMN IF NOT EXISTS counted_return integer,
ADD COLUMN IF NOT EXISTS divergence integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS divergence_notes text,
ADD COLUMN IF NOT EXISTS return_confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS return_confirmed_by uuid;

-- 3. Add stock payment fields to consignments
ALTER TABLE public.consignments
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'cash' CHECK (payment_type IN ('cash', 'stock', 'mixed')),
ADD COLUMN IF NOT EXISTS stock_payment_value numeric DEFAULT 0;

-- 4. Add stock payment tracking to consignment_items
ALTER TABLE public.consignment_items
ADD COLUMN IF NOT EXISTS used_as_payment integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;

-- Comment for clarity
COMMENT ON COLUMN public.transactions.dre_category IS 'DRE classification: sales, operational_cost, cogs';
COMMENT ON COLUMN public.transactions.cash_impact IS 'Whether this transaction affects cash flow';
COMMENT ON COLUMN public.event_stock_allocations.counted_return IS 'Blind count of returned items';
COMMENT ON COLUMN public.event_stock_allocations.divergence IS 'Difference between expected and counted return';
COMMENT ON COLUMN public.consignment_items.used_as_payment IS 'Quantity of items used to pay commission';