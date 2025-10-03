import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle } from "lucide-react";

interface SettleConsignmentModalProps {
  consignment: any;
}

export function SettleConsignmentModal({ consignment }: SettleConsignmentModalProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>(
    (consignment.consignment_items || []).map((item: any) => ({
      ...item,
      soldNow: 0,
    }))
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const settleConsignmentMutation = useMutation({
    mutationFn: async (data: { items: any[] }) => {
      // Update each consignment item
      const updatePromises = data.items.map(item =>
        supabase
          .from("consignment_items")
          .update({
            sold: item.sold,
            remaining: item.remaining,
          })
          .eq("id", item.id)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        throw errors[0].error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consignments"] });
      toast({
        title: "Sucesso!",
        description: "Acerto realizado com sucesso.",
      });
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao realizar acerto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleItemChange = (index: number, soldNow: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      soldNow: soldNow,
    };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedItems = items.map((item) => ({
      id: item.id,
      sold: (item.sold || 0) + (item.soldNow || 0),
      remaining: item.quantity - (item.sold || 0) - (item.soldNow || 0),
    }));

    settleConsignmentMutation.mutate({
      items: updatedItems,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CheckCircle className="w-4 h-4 mr-2" />
          Realizar Acerto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Realizar Acerto de Consignação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Enviado: {item.quantity} | Vendido anteriormente: {item.sold || 0} | Restante: {item.remaining || item.quantity}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantidade Vendida Agora</Label>
                    <input
                      type="number"
                      min="0"
                      max={item.remaining || item.quantity}
                      value={item.soldNow || 0}
                      onChange={(e) => handleItemChange(index, parseInt(e.target.value) || 0)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label>Restante Após Acerto</Label>
                    <input
                      type="number"
                      value={(item.remaining || item.quantity) - (item.soldNow || 0)}
                      disabled
                      className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={settleConsignmentMutation.isPending}>
              {settleConsignmentMutation.isPending ? "Processando..." : "Confirmar Acerto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
