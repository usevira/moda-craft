-- Adicionar referência de evento às transações para DRE por evento
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.events_stock(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_transactions_event_id ON public.transactions(event_id);

-- Comentário explicativo
COMMENT ON COLUMN public.transactions.event_id IS 'Referência ao evento para cálculo de DRE por evento específico';