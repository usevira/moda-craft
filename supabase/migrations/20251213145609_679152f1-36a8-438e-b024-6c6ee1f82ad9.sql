-- Criar tabela de eventos
CREATE TABLE public.events_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT get_my_tenant_id(),
  name TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de alocação de estoque para eventos
CREATE TABLE public.event_stock_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events_stock(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id),
  quantity_allocated INTEGER NOT NULL CHECK (quantity_allocated > 0),
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  quantity_returned INTEGER NOT NULL DEFAULT 0,
  allocated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  allocated_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.events_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_stock_allocations ENABLE ROW LEVEL SECURITY;

-- Políticas para events_stock
CREATE POLICY "Users can access events from their tenant"
ON public.events_stock FOR ALL
USING (tenant_id = get_my_tenant_id())
WITH CHECK (tenant_id = get_my_tenant_id());

-- Políticas para event_stock_allocations
CREATE POLICY "Users can access event allocations from their tenant"
ON public.event_stock_allocations FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.events_stock
  WHERE events_stock.id = event_stock_allocations.event_id
  AND events_stock.tenant_id = get_my_tenant_id()
));

-- Função para alocar estoque para evento (desconta do estoque FINAL)
CREATE OR REPLACE FUNCTION public.allocate_stock_to_event(
  p_event_id UUID,
  p_inventory_id UUID,
  p_quantity INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INTEGER;
  v_allocation_id UUID;
BEGIN
  -- Verificar estoque disponível
  SELECT get_available_stock(p_inventory_id) INTO v_available;
  
  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Estoque insuficiente. Disponível: %, Solicitado: %', v_available, p_quantity;
  END IF;
  
  -- Criar alocação
  INSERT INTO event_stock_allocations (event_id, inventory_id, quantity_allocated, allocated_by)
  VALUES (p_event_id, p_inventory_id, p_quantity, auth.uid())
  RETURNING id INTO v_allocation_id;
  
  -- Descontar do estoque
  UPDATE inventory
  SET quantity = quantity - p_quantity,
      updated_at = now()
  WHERE id = p_inventory_id;
  
  -- Registrar movimentação
  INSERT INTO inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, notes)
  VALUES (p_inventory_id, 'consignment_out', p_quantity, 'event', p_event_id, 'Alocação para evento');
  
  RETURN v_allocation_id;
END;
$$;

-- Função para registrar retorno de evento
CREATE OR REPLACE FUNCTION public.return_event_stock(
  p_allocation_id UUID,
  p_quantity_returned INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allocation RECORD;
  v_remaining INTEGER;
BEGIN
  -- Buscar alocação
  SELECT * INTO v_allocation
  FROM event_stock_allocations
  WHERE id = p_allocation_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alocação não encontrada';
  END IF;
  
  -- Calcular restante
  v_remaining := v_allocation.quantity_allocated - v_allocation.quantity_sold - v_allocation.quantity_returned;
  
  IF p_quantity_returned > v_remaining THEN
    RAISE EXCEPTION 'Quantidade de retorno excede o disponível. Disponível: %', v_remaining;
  END IF;
  
  -- Atualizar alocação
  UPDATE event_stock_allocations
  SET quantity_returned = quantity_returned + p_quantity_returned
  WHERE id = p_allocation_id;
  
  -- Devolver ao estoque
  UPDATE inventory
  SET quantity = quantity + p_quantity_returned,
      updated_at = now()
  WHERE id = v_allocation.inventory_id;
  
  -- Registrar movimentação
  INSERT INTO inventory_movements (inventory_id, movement_type, quantity, reference_type, reference_id, notes)
  VALUES (v_allocation.inventory_id, 'consignment_return', p_quantity_returned, 'event', v_allocation.event_id, 'Retorno de evento');
END;
$$;