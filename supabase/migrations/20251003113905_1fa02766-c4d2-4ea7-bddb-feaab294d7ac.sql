-- Corrigir search_path da função criada
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;