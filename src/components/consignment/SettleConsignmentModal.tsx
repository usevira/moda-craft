import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Package, DollarSign, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

interface SettleConsignmentModalProps {
  consignment: any;
}

// Helper para cálculos financeiros precisos
const toFixedNumber = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export function SettleConsignmentModal({ consignment }: SettleConsignmentModalProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [useStockPayment, setUseStockPayment] = useState(false);
  const [stockPaymentItems, setStockPaymentItems] = useState<Record<string, number>>({});
  const [commissionRate, setCommissionRate] = useState(40); // 40% default
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Inicializar items quando consignment mudar
  useEffect(() => {
    if (consignment?.consignment_items) {
      setItems(
        consignment.consignment_items.map((item: any) => ({
          ...item,
          soldNow: 0,
        }))
      );
    }
  }, [consignment]);

  // Calcular valores
  const calculateTotals = () => {
    let totalSoldValue = 0;
    let stockPaymentValue = 0;

    items.forEach((item) => {
      const soldNow = item.soldNow || 0;
      const unitPrice = Number(item.unit_price) || 0;
      totalSoldValue += toFixedNumber(soldNow * unitPrice);
    });

    // Calcular valor de peças usadas como pagamento
    Object.entries(stockPaymentItems).forEach(([itemId, qty]) => {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        const unitPrice = Number(item.unit_price) || 0;
        stockPaymentValue += toFixedNumber(qty * unitPrice);
      }
    });

    const commission = toFixedNumber(totalSoldValue * (commissionRate / 100));
    const netPayable = toFixedNumber(totalSoldValue - commission);
    const cashPayable = toFixedNumber(Math.max(0, netPayable - stockPaymentValue));

    return {
      totalSoldValue,
      commission,
      netPayable,
      stockPaymentValue,
      cashPayable,
    };
  };

  const totals = calculateTotals();

  const settleConsignmentMutation = useMutation({
    mutationFn: async (data: { 
      items: any[]; 
      stockPaymentItems: Record<string, number>;
      totals: ReturnType<typeof calculateTotals>;
    }) => {
      // 1. Update each consignment item
      const updatePromises = data.items.map((item) =>
        supabase
          .from("consignment_items")
          .update({
            sold: item.sold,
            remaining: item.remaining,
            used_as_payment: data.stockPaymentItems[item.id] || 0,
          })
          .eq("id", item.id)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        throw errors[0].error;
      }

      // 2. Update consignment status and payment info
      const { error: consignmentError } = await supabase
        .from("consignments")
        .update({
          status: "settled",
          payment_type: useStockPayment && data.totals.stockPaymentValue > 0 
            ? (data.totals.cashPayable > 0 ? "mixed" : "stock")
            : "cash",
          stock_payment_value: data.totals.stockPaymentValue,
        })
        .eq("id", consignment.id);

      if (consignmentError) throw consignmentError;

      // 3. Register commission transaction if there's a value
      if (data.totals.commission > 0) {
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert({
            type: "expense",
            category: "Comissão Consignação",
            dre_category: "operational_cost",
            cash_impact: data.totals.cashPayable > 0,
            amount: data.totals.commission,
            notes: `Comissão de consignação #${consignment.id.slice(0, 8)} - ${
              useStockPayment && data.totals.stockPaymentValue > 0
                ? `Pago ${formatCurrency(data.totals.stockPaymentValue)} em mercadoria`
                : "Pago em dinheiro"
            }`,
            date: new Date().toISOString().split("T")[0],
          });

        if (transactionError) throw transactionError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consignments"] });
      queryClient.invalidateQueries({ queryKey: ["dre-transactions"] });
      toast({
        title: "Sucesso!",
        description: useStockPayment && totals.stockPaymentValue > 0
          ? `Acerto realizado. ${formatCurrency(totals.stockPaymentValue)} abatido em mercadoria.`
          : "Acerto realizado com sucesso.",
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
      soldNow: Math.max(0, soldNow),
    };
    setItems(newItems);
  };

  const handleStockPaymentChange = (itemId: string, qty: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    
    const maxAvailable = (item.remaining || item.quantity) - (item.soldNow || 0);
    const safeQty = Math.min(Math.max(0, qty), maxAvailable);
    
    setStockPaymentItems((prev) => ({
      ...prev,
      [itemId]: safeQty,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedItems = items.map((item) => ({
      ...item,
      sold: (item.sold || 0) + (item.soldNow || 0),
      remaining: item.quantity - (item.sold || 0) - (item.soldNow || 0),
    }));

    settleConsignmentMutation.mutate({
      items: updatedItems,
      stockPaymentItems,
      totals,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Realizar Acerto de Consignação
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Configuração de comissão */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <Label htmlFor="commission-rate">Taxa de Comissão (%)</Label>
              <Input
                id="commission-rate"
                type="number"
                min={0}
                max={100}
                value={commissionRate}
                onChange={(e) => setCommissionRate(Number(e.target.value) || 0)}
                className="w-24 mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="stock-payment"
                checked={useStockPayment}
                onCheckedChange={setUseStockPayment}
              />
              <Label htmlFor="stock-payment" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Abater dívida com estoque?
              </Label>
            </div>
          </div>

          {/* Lista de itens */}
          <div className="space-y-4">
            {items.map((item, index) => {
              const remaining = (item.remaining ?? item.quantity) - (item.soldNow || 0);
              const stockPaymentQty = stockPaymentItems[item.id] || 0;
              const maxForPayment = remaining;
              
              return (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Enviado: {item.quantity} | Vendido anteriormente: {item.sold || 0} | 
                        Restante: {item.remaining ?? item.quantity}
                      </p>
                      {item.unit_price > 0 && (
                        <Badge variant="secondary" className="mt-1">
                          {formatCurrency(Number(item.unit_price))} / unidade
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quantidade Vendida Agora</Label>
                      <Input
                        type="number"
                        min={0}
                        max={item.remaining ?? item.quantity}
                        value={item.soldNow || 0}
                        onChange={(e) => handleItemChange(index, parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Restante Após Acerto</Label>
                      <Input
                        type="number"
                        value={remaining - stockPaymentQty}
                        disabled
                        className="mt-1 bg-muted"
                      />
                    </div>
                  </div>

                  {/* Opção de pagamento em mercadoria */}
                  {useStockPayment && remaining > 0 && (
                    <div className="pt-2 border-t">
                      <Label className="flex items-center gap-2 text-orange-600">
                        <Package className="h-4 w-4" />
                        Usar como pagamento de comissão
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          min={0}
                          max={maxForPayment}
                          value={stockPaymentQty}
                          onChange={(e) => handleStockPaymentChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          de {maxForPayment} disponíveis
                        </span>
                        {stockPaymentQty > 0 && item.unit_price > 0 && (
                          <Badge variant="outline" className="ml-auto">
                            = {formatCurrency(toFixedNumber(stockPaymentQty * Number(item.unit_price)))}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Resumo financeiro */}
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Resumo Financeiro
            </h4>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Vendido:</span>
                <span className="font-medium">{formatCurrency(totals.totalSoldValue)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>(-) Comissão ({commissionRate}%):</span>
                <span>{formatCurrency(totals.commission)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span>Valor a Pagar ao Parceiro:</span>
                <span className="font-medium">{formatCurrency(totals.netPayable)}</span>
              </div>
              
              {useStockPayment && totals.stockPaymentValue > 0 && (
                <>
                  <div className="flex justify-between text-orange-600">
                    <span>(-) Abatido em Mercadoria:</span>
                    <span>{formatCurrency(totals.stockPaymentValue)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Valor em Dinheiro:</span>
                    <span className="text-green-600">{formatCurrency(totals.cashPayable)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {useStockPayment && totals.stockPaymentValue > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Pagamento em Mercadoria</AlertTitle>
              <AlertDescription>
                As peças selecionadas serão baixadas do estoque consignado e registradas como
                pagamento de comissão. Uma transação será criada na categoria "Custos Operacionais".
              </AlertDescription>
            </Alert>
          )}

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
