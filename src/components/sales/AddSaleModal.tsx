import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";

type SalesChannel = 'online' | 'wholesale' | 'event' | 'store' | 'consignment';

type SaleItem = {
  variant_id: string;
  product_name: string;
  style: string;
  color: string;
  size: string;
  quantity: number;
  unit_price: number;
};

export function AddSaleModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [customerId, setCustomerId] = useState("");
  const [channel, setChannel] = useState<SalesChannel>("store");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<SaleItem[]>([]);
  
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch product variants with inventory
  const { data: variants } = useQuery({
    queryKey: ["product_variants_inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select(`
          *,
          products (name, sale_price),
          inventory (quantity)
        `);
      if (error) throw error;
      return data;
    },
  });

  const addItem = () => {
    if (!selectedVariantId || quantity <= 0) {
      toast({
        title: "Erro",
        description: "Selecione uma variante e quantidade válida.",
        variant: "destructive",
      });
      return;
    }

    const variant = variants?.find((v) => v.id === selectedVariantId);
    if (!variant) return;

    const inventoryQty = variant.inventory?.[0]?.quantity || 0;
    if (quantity > inventoryQty) {
      toast({
        title: "Estoque insuficiente",
        description: `Apenas ${inventoryQty} unidades disponíveis.`,
        variant: "destructive",
      });
      return;
    }

    setItems([
      ...items,
      {
        variant_id: variant.id,
        product_name: variant.products?.name || "",
        style: variant.style,
        color: variant.color,
        size: variant.size,
        quantity,
        unit_price: variant.products?.sale_price || 0,
      },
    ]);
    
    setSelectedVariantId("");
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item à venda.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Calculate commission rate based on channel
      const commissionRates: Record<SalesChannel, number> = {
        online: 5,
        wholesale: 10,
        event: 8,
        store: 0,
        consignment: 30,
      };

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert([{
          customer_id: customerId || null,
          channel,
          total,
          commission_rate: commissionRates[channel],
          payment_method: paymentMethod || null,
          notes: notes || null,
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items and update inventory
      for (const item of items) {
        // Insert sale item
        const { error: itemError } = await supabase
          .from("sales_items")
          .insert([{
            sale_id: sale.id,
            product_id: null,
            qty: item.quantity,
            unit_price: item.unit_price,
            size: item.size,
            color: item.color,
          }]);

        if (itemError) throw itemError;

        // Update inventory
        const { data: inventory } = await supabase
          .from("inventory")
          .select("*")
          .eq("product_style", item.style as "T-Shirt" | "Oversized")
          .eq("color", item.color)
          .eq("size", item.size)
          .eq("inventory_type", "finished_product")
          .single();

        if (inventory) {
          const { error: invError } = await supabase
            .from("inventory")
            .update({ quantity: inventory.quantity - item.quantity })
            .eq("id", inventory.id);

          if (invError) throw invError;

          // Register movement
          await supabase.from("inventory_movements").insert([{
            movement_type: "sale",
            inventory_id: inventory.id,
            quantity: -item.quantity,
            reference_type: "sale",
            reference_id: sale.id,
            notes: `Venda #${sale.id}`,
          }]);
        }
      }

      toast({
        title: "Venda registrada",
        description: "Venda registrada e estoque atualizado com sucesso!",
      });

      setOpen(false);
      setCustomerId("");
      setChannel("store");
      setPaymentMethod("");
      setNotes("");
      setItems([]);
      window.location.reload();
    } catch (error: any) {
      console.error("Error adding sale:", error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Venda
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nova Venda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cliente</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
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
            <div>
              <Label>Canal de Venda</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as SalesChannel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">🏪 Loja Física</SelectItem>
                  <SelectItem value="online">🌐 Online</SelectItem>
                  <SelectItem value="wholesale">📦 Atacado</SelectItem>
                  <SelectItem value="event">🎪 Evento</SelectItem>
                  <SelectItem value="consignment">🤝 Consignação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Forma de Pagamento</Label>
              <Input
                placeholder="Ex: Pix, Cartão, Dinheiro"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
            </div>
            <div>
              <Label>Comissão</Label>
              <Input
                value={`${channel === 'store' ? 0 : channel === 'online' ? 5 : channel === 'event' ? 8 : channel === 'wholesale' ? 10 : 30}%`}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações sobre a venda (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium">Adicionar Itens</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label>Produto (Variante)</Label>
                <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a variante" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants?.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.products?.name} - {variant.style} {variant.color} {variant.size} 
                        (Estoque: {variant.inventory?.[0]?.quantity || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Qtd</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <Button type="button" onClick={addItem} className="w-full">
              Adicionar Item
            </Button>
          </div>

          {items.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-medium">Itens da Venda</h4>
              {items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.style} - {item.color} - {item.size} - Qtd: {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      R$ {(item.quantity * item.unit_price).toFixed(2)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-bold">Total:</span>
                <span className="text-2xl font-bold">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || items.length === 0}>
              {loading ? "Registrando..." : "Registrar Venda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
