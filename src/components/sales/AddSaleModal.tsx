import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export function AddSaleModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    customer_id: "",
    type: "direct",
    total: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('sales')
        .insert([{
          ...formData,
          tenant_id: '00000000-0000-0000-0000-000000000000' // Placeholder tenant
        }]);

      if (error) throw error;

      toast({
        title: "Venda registrada",
        description: "Venda registrada com sucesso!",
      });

      setOpen(false);
      setFormData({ customer_id: "", type: "direct", total: 0 });
      window.location.reload();
    } catch (error) {
      console.error('Error adding sale:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar venda.",
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Nova Venda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer_id">ID do Cliente</Label>
            <Input
              id="customer_id"
              value={formData.customer_id}
              onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Tipo de Venda</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Venda Direta</SelectItem>
                <SelectItem value="consignment">Consignação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="total">Valor Total</Label>
            <Input
              id="total"
              type="number"
              step="0.01"
              value={formData.total}
              onChange={(e) => setFormData({...formData, total: parseFloat(e.target.value) || 0})}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Registrando..." : "Registrar Venda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}