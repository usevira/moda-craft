import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RegisterEventSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: { id: string; name: string };
  onSuccess: () => void;
}

export function RegisterEventSaleModal({ open, onOpenChange, event, onSuccess }: RegisterEventSaleModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  // Buscar alocações do evento com estoque disponível para venda
  const { data: allocations } = useQuery({
    queryKey: ["event_allocations_for_sale", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_stock_allocations")
        .select(`
          *,
          inventory:inventory_id (
            product_style,
            color,
            size
          )
        `)
        .eq("event_id", event.id);
      if (error) throw error;
      // Filtrar apenas alocações com itens disponíveis para venda
      return data?.filter(a => (a.quantity_allocated - a.quantity_sold - a.quantity_returned) > 0);
    },
    enabled: open,
  });

  const selectedItem = allocations?.find(a => a.id === selectedAllocation);
  const maxSale = selectedItem 
    ? selectedItem.quantity_allocated - selectedItem.quantity_sold - selectedItem.quantity_returned 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocation || quantity < 1) {
      toast({ title: "Erro", description: "Selecione uma alocação e quantidade válida", variant: "destructive" });
      return;
    }

    if (quantity > maxSale) {
      toast({ title: "Erro", description: `Máximo disponível: ${maxSale} unidades`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Atualizar a quantidade vendida na alocação
      const { error } = await supabase
        .from("event_stock_allocations")
        .update({ 
          quantity_sold: (selectedItem?.quantity_sold || 0) + quantity 
        })
        .eq("id", selectedAllocation);

      if (error) throw error;

      toast({ title: "Sucesso", description: `${quantity} peças registradas como vendidas` });
      onSuccess();
      onOpenChange(false);
      setSelectedAllocation("");
      setQuantity(1);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Venda</DialogTitle>
          <DialogDescription>Registrar venda no evento: {event.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Produto Alocado</Label>
            <Select value={selectedAllocation} onValueChange={setSelectedAllocation}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {allocations?.map((alloc) => {
                  const inv = alloc.inventory as any;
                  const available = alloc.quantity_allocated - alloc.quantity_sold - alloc.quantity_returned;
                  return (
                    <SelectItem key={alloc.id} value={alloc.id}>
                      {inv?.product_style} - {inv?.color} - {inv?.size} (Disp: {available})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade Vendida</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={maxSale}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            {selectedItem && (
              <p className="text-sm text-muted-foreground">
                Disponível para venda: {maxSale} unidades
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedAllocation}>
              {loading ? "Registrando..." : "Registrar Venda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
