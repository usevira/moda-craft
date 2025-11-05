import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CreateTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTransferModal({ open, onOpenChange }: CreateTransferModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    from_store_id: "",
    to_store_id: "",
    inventory_id: "",
    quantity: "",
    notes: "",
  });

  const { data: stores } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: inventory } = useQuery({
    queryKey: ["inventory-for-transfer", formData.from_store_id],
    queryFn: async () => {
      const query = supabase
        .from("inventory")
        .select("*")
        .gt("quantity", 0);
      
      if (formData.from_store_id) {
        query.eq("store_id", formData.from_store_id);
      }
      
      const { data, error } = await query.order("product_id");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const createTransferMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("store_transfers").insert({
        from_store_id: data.from_store_id || null,
        to_store_id: data.to_store_id,
        inventory_id: data.inventory_id,
        quantity: parseInt(data.quantity),
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-transfers"] });
      toast.success("Transferência criada");
      onOpenChange(false);
      setFormData({
        from_store_id: "",
        to_store_id: "",
        inventory_id: "",
        quantity: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.to_store_id || !formData.inventory_id || !formData.quantity) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createTransferMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transferência</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Loja de Origem</Label>
            <Select
              value={formData.from_store_id}
              onValueChange={(value) =>
                setFormData({ ...formData, from_store_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Estoque Central" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Estoque Central</SelectItem>
                {stores?.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name} ({store.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Loja de Destino *</Label>
            <Select
              value={formData.to_store_id}
              onValueChange={(value) =>
                setFormData({ ...formData, to_store_id: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {stores?.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name} ({store.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Item do Estoque *</Label>
            <Select
              value={formData.inventory_id}
              onValueChange={(value) =>
                setFormData({ ...formData, inventory_id: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {inventory?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.color} - {item.size} (Qtd: {item.quantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantidade *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Observações sobre a transferência"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createTransferMutation.isPending}>
              Criar Transferência
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
