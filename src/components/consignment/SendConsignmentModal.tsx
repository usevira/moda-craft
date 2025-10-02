import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConsignmentItem {
  product: string;
  quantity: number;
  remaining: number;
  sold: number;
}

export function SendConsignmentModal() {
  const [open, setOpen] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [items, setItems] = useState<ConsignmentItem[]>([
    { product: "", quantity: 0, remaining: 0, sold: 0 },
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["resellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("type", "reseller")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: inventory } = useQuery({
    queryKey: ["inventory-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products (name, sku)
        `)
        .gt("quantity", 0)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const sendConsignmentMutation = useMutation({
    mutationFn: async (data: { partner_id: string; items: ConsignmentItem[] }) => {
      const { error } = await supabase.from("consignments").insert({
        partner_id: data.partner_id,
        items: data.items.map(item => ({
          ...item,
          remaining: item.quantity,
          sold: 0
        })),
        status: "open",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consignments"] });
      toast({
        title: "Sucesso!",
        description: "Consignação enviada com sucesso.",
      });
      setOpen(false);
      setPartnerId("");
      setItems([{ product: "", quantity: 0, remaining: 0, sold: 0 }]);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao enviar consignação: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddItem = () => {
    setItems([...items, { product: "", quantity: 0, remaining: 0, sold: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ConsignmentItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!partnerId) {
      toast({
        title: "Erro",
        description: "Selecione um revendedor.",
        variant: "destructive",
      });
      return;
    }

    const validItems = items.filter(item => item.product && item.quantity > 0);
    if (validItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um produto.",
        variant: "destructive",
      });
      return;
    }

    sendConsignmentMutation.mutate({ partner_id: partnerId, items: validItems });
  };

  const getProductLabel = (item: any) => {
    const product = item.products;
    return `${product?.name || 'N/A'} - ${item.color || ''} ${item.size || ''} (${item.quantity} disponível)`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Enviar para Consignação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Novos Produtos para Consignação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Selecione o Revendedor</Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um revendedor" />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Produtos do Estoque Pronto (um por linha)</Label>
              <Button type="button" onClick={handleAddItem} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
            
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                <div className="col-span-7">
                  <Label>Produto</Label>
                  <Textarea
                    placeholder="Ex: 5 Camiseta Masculina Preta M Caveira"
                    value={item.product}
                    onChange={(e) => handleItemChange(index, "product", e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                
                <div className="col-span-4">
                  <Label>Quantidade</Label>
                  <input
                    type="number"
                    min="0"
                    value={item.quantity || ""}
                    onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            Informe a quantidade e o nome EXATO do produto como aparece no inventário.
          </p>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={sendConsignmentMutation.isPending}>
              {sendConsignmentMutation.isPending ? "Enviando..." : "Enviar para Consignação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
