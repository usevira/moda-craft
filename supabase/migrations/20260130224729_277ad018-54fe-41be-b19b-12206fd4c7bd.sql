-- Add sales_goal column to events_stock table
ALTER TABLE public.events_stock 
ADD COLUMN sales_goal numeric DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.events_stock.sales_goal IS 'Meta de vendas para o evento';