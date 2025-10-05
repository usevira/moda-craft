import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface RegisterSaleModalProps {
  consignmentItem: any;
  consignmentId: string;
  resellerCustomer: any;
}

export function RegisterSaleModal({ consignmentItem, consignmentId, resellerCustomer }: RegisterSaleModalProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (quantity > consignmentItem.remaining) {
        toast({
          title: "Erro",
          description: "Quantidade excede o estoque disponível",
          variant: "destructive",
        });
        return;
      }

      // Atualizar o item de consignação
      const newSold = (consignmentItem.sold || 0) + quantity;
      const newRemaining = (consignmentItem.remaining || 0) - quantity;

      const { error: updateError } = await supabase
        .from("consignment_items")
        .update({
          sold: newSold,
          remaining: newRemaining,
        })
        .eq("id", consignmentItem.id);

      if (updateError) throw updateError;

      toast({
        title: "Venda registrada",
        description: `${quantity} unidade(s) de ${consignmentItem.product_name} vendida(s)`,
      });

      queryClient.invalidateQueries({ queryKey: ["reseller-consignments"] });
      setOpen(false);
      setQuantity(1);
    } catch (error) {
      console.error("Error registering sale:", error);
      toast({
        title: "Erro ao registrar venda",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <ShoppingCart className="w-4 h-4" />
          Registrar Venda
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Venda</DialogTitle>
            <DialogDescription>
              Registre a venda de produtos da sua consignação
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Produto</Label>
              <Input value={consignmentItem.product_name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Disponível em Estoque</Label>
              <Input value={consignmentItem.remaining || 0} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade Vendida</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={consignmentItem.remaining || 0}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Registrando..." : "Registrar Venda"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
