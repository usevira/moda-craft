import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

export const AddInventoryModal = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    product_id: "",
    inventory_type: "raw_material" as "raw_material" | "finished_product",
    product_style: "" as "T-Shirt" | "Oversized" | "",
    color: "",
    size: "",
    quantity: 0,
    min_stock: 5,
    location: "",
    warehouse_section: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("inventory").insert([
        {
          product_id: formData.product_id || null,
          inventory_type: formData.inventory_type,
          product_style: formData.product_style || null,
          color: formData.color,
          size: formData.size,
          quantity: formData.quantity,
          min_stock: formData.min_stock,
          location: formData.location || null,
          warehouse_section: formData.warehouse_section || null,
        },
      ]);

      if (error) throw error;

      // Register movement
      await supabase.from("inventory_movements").insert([
        {
          movement_type: "purchase",
          product_id: formData.product_id || null,
          quantity: formData.quantity,
          notes: "Adição manual ao estoque",
        },
      ]);

      toast({
        title: "Sucesso!",
        description: "Item adicionado ao estoque.",
      });

      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setOpen(false);
      setFormData({
        product_id: "",
        inventory_type: "raw_material",
        product_style: "",
        color: "",
        size: "",
        quantity: 0,
        min_stock: 5,
        location: "",
        warehouse_section: "",
      });
    } catch (error: any) {
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
          Adicionar Item ao Estoque
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Item ao Estoque</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inventory_type">Tipo de Estoque</Label>
              <Select
                value={formData.inventory_type}
                onValueChange={(value: "raw_material" | "finished_product") =>
                  setFormData({ ...formData, inventory_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="raw_material">Matéria-Prima (Camiseta Lisa)</SelectItem>
                  <SelectItem value="finished_product">Produto Acabado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_style">Estilo de Camiseta</Label>
              <Select
                value={formData.product_style}
                onValueChange={(value: "T-Shirt" | "Oversized" | "") =>
                  setFormData({ ...formData, product_style: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estilo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T-Shirt">T-Shirt</SelectItem>
                  <SelectItem value="Oversized">Oversized</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="Ex: Preto, Branco"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Tamanho</Label>
              <Select
                value={formData.size}
                onValueChange={(value) =>
                  setFormData({ ...formData, size: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tamanho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PP">PP</SelectItem>
                  <SelectItem value="P">P</SelectItem>
                  <SelectItem value="M">M</SelectItem>
                  <SelectItem value="G">G</SelectItem>
                  <SelectItem value="GG">GG</SelectItem>
                  <SelectItem value="XG">XG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_stock">Estoque Mínimo</Label>
              <Input
                id="min_stock"
                type="number"
                value={formData.min_stock}
                onChange={(e) =>
                  setFormData({ ...formData, min_stock: parseInt(e.target.value) || 5 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Ex: Prateleira A3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse_section">Seção</Label>
              <Select
                value={formData.warehouse_section}
                onValueChange={(value) =>
                  setFormData({ ...formData, warehouse_section: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a seção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Camisetas Lisas">Camisetas Lisas</SelectItem>
                  <SelectItem value="Produtos Acabados">Produtos Acabados</SelectItem>
                  <SelectItem value="Consignação">Consignação</SelectItem>
                  <SelectItem value="Separação">Separação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
