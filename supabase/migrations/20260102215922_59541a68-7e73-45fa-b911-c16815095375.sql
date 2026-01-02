-- Create commission_statements table for monthly representative accountability
CREATE TABLE public.commission_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL DEFAULT get_my_tenant_id(),
  representative_id UUID NOT NULL REFERENCES public.customers(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sales NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.40,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date DATE,
  payment_proof_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'closed', 'paid'))
);

-- Enable RLS
ALTER TABLE public.commission_statements ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can access commission statements from their tenant"
ON public.commission_statements
FOR ALL
USING (tenant_id = get_my_tenant_id())
WITH CHECK (tenant_id = get_my_tenant_id());

-- Create index for faster queries
CREATE INDEX idx_commission_statements_representative ON public.commission_statements(representative_id);
CREATE INDEX idx_commission_statements_period ON public.commission_statements(period_start, period_end);
CREATE INDEX idx_commission_statements_status ON public.commission_statements(status);