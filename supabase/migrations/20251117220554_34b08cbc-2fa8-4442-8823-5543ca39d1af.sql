-- Função para atualizar estoque quando transferência é concluída
CREATE OR REPLACE FUNCTION handle_transfer_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Só processa se o status mudou para 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Se tem loja de origem, reduz o estoque dela
    IF NEW.from_store_id IS NOT NULL THEN
      UPDATE inventory
      SET quantity = quantity - NEW.quantity,
          updated_at = now()
      WHERE id = NEW.inventory_id
        AND store_id = NEW.from_store_id;
    ELSE
      -- Se não tem loja de origem, reduz do estoque central (sem store_id)
      UPDATE inventory
      SET quantity = quantity - NEW.quantity,
          updated_at = now()
      WHERE id = NEW.inventory_id
        AND store_id IS NULL;
    END IF;
    
    -- Aumenta o estoque na loja de destino
    -- Primeiro verifica se já existe inventário na loja de destino
    IF EXISTS (
      SELECT 1 FROM inventory i1
      WHERE i1.product_id = (SELECT product_id FROM inventory WHERE id = NEW.inventory_id)
        AND i1.color = (SELECT color FROM inventory WHERE id = NEW.inventory_id)
        AND i1.size = (SELECT size FROM inventory WHERE id = NEW.inventory_id)
        AND i1.store_id = NEW.to_store_id
    ) THEN
      -- Se existe, atualiza
      UPDATE inventory
      SET quantity = quantity + NEW.quantity,
          updated_at = now()
      WHERE product_id = (SELECT product_id FROM inventory WHERE id = NEW.inventory_id)
        AND color = (SELECT color FROM inventory WHERE id = NEW.inventory_id)
        AND size = (SELECT size FROM inventory WHERE id = NEW.inventory_id)
        AND store_id = NEW.to_store_id;
    ELSE
      -- Se não existe, cria novo registro
      INSERT INTO inventory (
        product_id,
        color,
        size,
        product_style,
        inventory_type,
        quantity,
        store_id,
        min_stock,
        tenant_id
      )
      SELECT
        product_id,
        color,
        size,
        product_style,
        inventory_type,
        NEW.quantity,
        NEW.to_store_id,
        min_stock,
        tenant_id
      FROM inventory
      WHERE id = NEW.inventory_id;
    END IF;
    
    -- Registra o movimento de estoque
    INSERT INTO inventory_movements (
      inventory_id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      notes
    ) VALUES (
      NEW.inventory_id,
      'transfer',
      NEW.quantity,
      'store_transfer',
      NEW.id,
      'Transferência de ' || 
      COALESCE((SELECT name FROM stores WHERE id = NEW.from_store_id), 'Estoque Central') ||
      ' para ' ||
      (SELECT name FROM stores WHERE id = NEW.to_store_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para atualizar estoque em transferências
CREATE TRIGGER update_inventory_on_transfer_completion
  AFTER UPDATE ON store_transfers
  FOR EACH ROW
  EXECUTE FUNCTION handle_transfer_completion();