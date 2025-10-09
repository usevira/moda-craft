import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AddBatchModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [calculatedCost, setCalculatedCost] = useState<number>(0);
  const [insufficientMaterials, setInsufficientMaterials] = useState<any[]>([]);

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch bill of materials for selected product
  const { data: billOfMaterials } = useQuery({
    queryKey: ["billOfMaterials", selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return [];
      const { data, error } = await supabase
        .from("bill_of_materials")
        .select("*, materials (*)")
        .eq("product_id", selectedProductId);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProductId,
  });

  // Calculate cost and check materials when product or quantity changes
  useEffect(() => {
    if (billOfMaterials && quantity > 0) {
      let totalCost = 0;
      const insufficient: any[] = [];

      billOfMaterials.forEach((bom: any) => {
        const requiredQty = bom.quantity_required * quantity;
        const materialCost = (bom.materials?.unit_cost || 0) * requiredQty;
        totalCost += materialCost;

        // Check if there's enough stock
        if (bom.materials && bom.materials.stock < requiredQty) {
          insufficient.push({
            name: bom.materials.name,
            required: requiredQty,
            available: bom.materials.stock,
            missing: requiredQty - bom.materials.stock,
          });
        }
      });

      setCalculatedCost(totalCost);
      setInsufficientMaterials(insufficient);
    }
  }, [billOfMaterials, quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductId) {
      toast({
        title: "Erro",
        description: "Selecione um produto.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const selectedProduct = products?.find(p => p.id === selectedProductId);
      
      // Create batch
      const { data: newBatch, error: batchError } = await supabase
        .from('batches')
        .insert([{
          product_name: selectedProduct?.name || "",
          quantity,
          total_cost: calculatedCost,
          style: (selectedStyle as "T-Shirt" | "Oversized") || null,
          status: 'planned'
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      // Create batch_materials records
      if (billOfMaterials && billOfMaterials.length > 0) {
        const batchMaterialsData = billOfMaterials.map((bom: any) => ({
          batch_id: newBatch.id,
          material_id: bom.material_id,
          qty_used: bom.quantity_required * quantity,
        }));

        const { error: materialsError } = await supabase
          .from('batches_materials')
          .insert(batchMaterialsData);

        if (materialsError) throw materialsError;
      }

      toast({
        title: "Lote criado",
        description: "Lote de produção criado com sucesso!",
      });

      setOpen(false);
      setSelectedProductId("");
      setQuantity(1);
      setCalculatedCost(0);
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
            <Label htmlFor="product">Produto</Label>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products?.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="style">Estilo</Label>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estilo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="T-Shirt">T-Shirt</SelectItem>
                <SelectItem value="Oversized">Oversized</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
          </div>

          {billOfMaterials && billOfMaterials.length > 0 && (
            <div className="border rounded-lg p-3 space-y-2">
              <h4 className="font-medium text-sm">Materiais Necessários:</h4>
              {billOfMaterials.map((bom: any) => (
                <div key={bom.id} className="flex justify-between text-sm">
                  <span>{bom.materials?.name}</span>
                  <span className="text-muted-foreground">
                    {(bom.quantity_required * quantity).toFixed(2)} {bom.materials?.unit}
                  </span>
                </div>
              ))}
            </div>
          )}

          {insufficientMaterials.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Materiais insuficientes:</strong>
                {insufficientMaterials.map((mat, idx) => (
                  <div key={idx} className="mt-1">
                    {mat.name}: Faltam {mat.missing.toFixed(2)} (disponível: {mat.available})
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label>Custo Total Calculado</Label>
            <div className="text-2xl font-bold text-primary">
              R$ {calculatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedProductId || insufficientMaterials.length > 0}
            >
              {loading ? "Criando..." : "Criar Lote"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}