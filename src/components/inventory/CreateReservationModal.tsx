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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateReservationModal({
  open,
  onOpenChange,
}: CreateReservationModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    inventory_id: "",
    quantity: "",
    reference_type: "",
    expires_hours: "24",
    notes: "",
  });

  const { data: inventory } = useQuery({
    queryKey: ["inventory-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .gt("quantity", 0)
        .order("product_id");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(data.expires_hours));

      const { error } = await supabase.from("stock_reservations").insert({
        inventory_id: data.inventory_id,
        quantity: parseInt(data.quantity),
        reference_type: data.reference_type || null,
        expires_at: expiresAt.toISOString(),
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-reservations"] });
      toast.success("Reserva criada");
      onOpenChange(false);
      setFormData({
        inventory_id: "",
        quantity: "",
        reference_type: "",
        expires_hours: "24",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.inventory_id || !formData.quantity) {
      toast.error("Selecione um item e quantidade");
      return;
    }
    createReservationMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Reserva de Estoque</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                    {item.color} - {item.size} (Disponível: {item.quantity})
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
            <Label htmlFor="reference_type">Tipo de Referência</Label>
            <Input
              id="reference_type"
              value={formData.reference_type}
              onChange={(e) =>
                setFormData({ ...formData, reference_type: e.target.value })
              }
              placeholder="Ex: Pedido, Orçamento"
            />
          </div>

          <div>
            <Label htmlFor="expires_hours">Expira em (horas)</Label>
            <Input
              id="expires_hours"
              type="number"
              min="1"
              value={formData.expires_hours}
              onChange={(e) =>
                setFormData({ ...formData, expires_hours: e.target.value })
              }
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
              placeholder="Detalhes sobre a reserva"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createReservationMutation.isPending}>
              Criar Reserva
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
