import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export function AddInventoryModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    product_id: "",
    color: "",
    size: "",
    quantity: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('inventory')
        .insert([{
          ...formData,
          tenant_id: '00000000-0000-0000-0000-000000000000' // Placeholder tenant
        }]);

      if (error) throw error;

      toast({
        title: "Produto adicionado",
        description: "Produto adicionado ao estoque com sucesso!",
      });

      setOpen(false);
      setFormData({ product_id: "", color: "", size: "", quantity: 0 });
      window.location.reload();
    } catch (error) {
      console.error('Error adding inventory:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar produto ao estoque.",
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
          Adicionar Produto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Produto ao Estoque</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product_id">ID do Produto</Label>
            <Input
              id="product_id"
              value={formData.product_id}
              onChange={(e) => setFormData({...formData, product_id: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="color">Cor</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="size">Tamanho</Label>
            <Select value={formData.size} onValueChange={(value) => setFormData({...formData, size: value})}>
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
          <div>
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}