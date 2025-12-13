import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AllocateStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: { id: string; name: string };
  onSuccess: () => void;
}

export function AllocateStockModal({ open, onOpenChange, event, onSuccess }: AllocateStockModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  // Buscar apenas produtos acabados (finished_product)
  const { data: inventory } = useQuery({
    queryKey: ["finished_inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("inventory_type", "finished_product")
        .gt("quantity", 0)
        .order("product_style");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const selectedItem = inventory?.find(i => i.id === selectedInventory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory || quantity < 1) {
      toast({ title: "Erro", description: "Selecione um produto e quantidade válida", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc("allocate_stock_to_event", {
        p_event_id: event.id,
        p_inventory_id: selectedInventory,
        p_quantity: quantity,
      });

      if (error) throw error;

      toast({ title: "Sucesso", description: `${quantity} peças alocadas para ${event.name}` });
      onSuccess();
      onOpenChange(false);
      setSelectedInventory("");
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
          <DialogTitle>Alocar Estoque</DialogTitle>
          <DialogDescription>Alocar produtos para o evento: {event.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Produto (Estoque Final)</Label>
            <Select value={selectedInventory} onValueChange={setSelectedInventory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {inventory?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.product_style} - {item.color} - {item.size} (Disp: {item.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={selectedItem?.quantity || 1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            {selectedItem && (
              <p className="text-sm text-muted-foreground">
                Disponível: {selectedItem.quantity} unidades
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !selectedInventory}>
              {loading ? "Alocando..." : "Alocar Estoque"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
