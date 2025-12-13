import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReturnStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: { id: string; name: string };
  onSuccess: () => void;
}

export function ReturnStockModal({ open, onOpenChange, event, onSuccess }: ReturnStockModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  // Buscar alocações do evento com estoque pendente
  const { data: allocations } = useQuery({
    queryKey: ["event_allocations", event.id],
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
      // Filtrar apenas alocações com itens pendentes
      return data?.filter(a => (a.quantity_allocated - a.quantity_sold - a.quantity_returned) > 0);
    },
    enabled: open,
  });

  const selectedItem = allocations?.find(a => a.id === selectedAllocation);
  const maxReturn = selectedItem 
    ? selectedItem.quantity_allocated - selectedItem.quantity_sold - selectedItem.quantity_returned 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocation || quantity < 1) {
      toast({ title: "Erro", description: "Selecione uma alocação e quantidade válida", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc("return_event_stock", {
        p_allocation_id: selectedAllocation,
        p_quantity_returned: quantity,
      });

      if (error) throw error;

      toast({ title: "Sucesso", description: `${quantity} peças retornadas ao estoque` });
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
          <DialogTitle>Retornar Estoque</DialogTitle>
          <DialogDescription>Retornar produtos não vendidos do evento: {event.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Alocação</Label>
            <Select value={selectedAllocation} onValueChange={setSelectedAllocation}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma alocação" />
              </SelectTrigger>
              <SelectContent>
                {allocations?.map((alloc) => {
                  const inv = alloc.inventory as any;
                  const pending = alloc.quantity_allocated - alloc.quantity_sold - alloc.quantity_returned;
                  return (
                    <SelectItem key={alloc.id} value={alloc.id}>
                      {inv?.product_style} - {inv?.color} - {inv?.size} (Pendente: {pending})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade a Retornar</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={maxReturn}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            {selectedItem && (
              <p className="text-sm text-muted-foreground">
                Máximo disponível para retorno: {maxReturn} unidades
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedAllocation}>
              {loading ? "Retornando..." : "Confirmar Retorno"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
