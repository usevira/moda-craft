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
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConsignmentItem {
  variant_id: string;
  quantity: number;
}

export function SendConsignmentModal() {
  const [open, setOpen] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [items, setItems] = useState<ConsignmentItem[]>([
    { variant_id: "", quantity: 0 },
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

  const { data: variants } = useQuery({
    queryKey: ["variants-with-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(`
          *,
          products (name, sku)
        `);
      
      if (error) throw error;
      
      // Get inventory for each variant
      const variantsWithStock = await Promise.all(
        (data || []).map(async (variant) => {
          const { data: inv } = await supabase
            .from("inventory")
            .select("quantity")
            .eq("product_id", variant.product_id)
            .eq("color", variant.color)
            .eq("size", variant.size)
            .eq("product_style", variant.style)
            .single();
          
          return { ...variant, stock: inv?.quantity || 0 };
        })
      );
      
      return variantsWithStock.filter(v => v.stock > 0);
    },
  });

  const sendConsignmentMutation = useMutation({
    mutationFn: async (data: { partner_id: string; items: ConsignmentItem[] }) => {
      // First, insert the consignment
      const { data: consignment, error: consignmentError } = await supabase
        .from("consignments")
        .insert({
          partner_id: data.partner_id,
          status: "open",
        })
        .select()
        .single();

      if (consignmentError) throw consignmentError;

      // Get variant details for each item
      const itemsWithDetails = await Promise.all(
        data.items.map(async (item) => {
          const variant = variants?.find(v => v.id === item.variant_id);
          const product = variant?.products;
          return {
            consignment_id: consignment.id,
            product_name: `${product?.name || 'N/A'} - ${variant?.color} ${variant?.size} (${variant?.style})`,
            quantity: item.quantity,
            sold: 0,
            remaining: item.quantity,
          };
        })
      );

      // Then, insert the consignment items
      const { error: itemsError } = await supabase
        .from("consignment_items")
        .insert(itemsWithDetails);

      if (itemsError) throw itemsError;

      // Update inventory - decrease quantity
      for (const item of data.items) {
        const variant = variants?.find(v => v.id === item.variant_id);
        if (variant) {
          // Get current inventory
          const { data: currentInv } = await supabase
            .from("inventory")
            .select("quantity, id")
            .eq("product_id", variant.product_id)
            .eq("color", variant.color)
            .eq("size", variant.size)
            .eq("product_style", variant.style)
            .single();
          
          if (currentInv) {
            const newQuantity = Math.max(0, (currentInv.quantity || 0) - item.quantity);
            await supabase
              .from("inventory")
              .update({ quantity: newQuantity })
              .eq("id", currentInv.id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consignments"] });
      toast({
        title: "Sucesso!",
        description: "Consignação enviada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["inventory-finished"] });
      setOpen(false);
      setPartnerId("");
      setItems([{ variant_id: "", quantity: 0 }]);
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
    setItems([...items, { variant_id: "", quantity: 0 }]);
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

    const validItems = items.filter(item => item.variant_id && item.quantity > 0);
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
            
            {items.map((item, index) => {
              const selectedVariant = variants?.find(v => v.id === item.variant_id);
              const maxQty = selectedVariant?.stock || 0;
              
              return (
                <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                  <div className="col-span-7">
                    <Label>Produto / Variante</Label>
                    <Select 
                      value={item.variant_id} 
                      onValueChange={(value) => handleItemChange(index, "variant_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma variante" />
                      </SelectTrigger>
                      <SelectContent>
                        {variants?.map((variant) => (
                          <SelectItem key={variant.id} value={variant.id}>
                            {variant.products?.name} - {variant.color} {variant.size} ({variant.style}) - {variant.stock} em estoque
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-4">
                    <Label>Quantidade (máx: {maxQty})</Label>
                    <Input
                      type="number"
                      min="0"
                      max={maxQty}
                      value={item.quantity || ""}
                      onChange={(e) => handleItemChange(index, "quantity", Math.min(parseInt(e.target.value) || 0, maxQty))}
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
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">
            Selecione as variantes do estoque e a quantidade a enviar.
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
