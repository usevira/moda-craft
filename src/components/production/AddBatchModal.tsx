import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export function AddBatchModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    product_name: "",
    quantity: 0,
    total_cost: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('batches')
        .insert([{
          ...formData,
          tenant_id: '00000000-0000-0000-0000-000000000000', // Placeholder tenant
          status: 'planned'
        }]);

      if (error) throw error;

      toast({
        title: "Lote criado",
        description: "Lote de produção criado com sucesso!",
      });

      setOpen(false);
      setFormData({ product_name: "", quantity: 0, total_cost: 0 });
      window.location.reload();
    } catch (error) {
      console.error('Error adding batch:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar lote de produção.",
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
          Novo Lote
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Lote de Produção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product_name">Nome do Produto</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData({...formData, product_name: e.target.value})}
              required
            />
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
          <div>
            <Label htmlFor="total_cost">Custo Total</Label>
            <Input
              id="total_cost"
              type="number"
              step="0.01"
              value={formData.total_cost}
              onChange={(e) => setFormData({...formData, total_cost: parseFloat(e.target.value) || 0})}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Lote"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}