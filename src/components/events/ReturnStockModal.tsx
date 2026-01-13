import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReturnStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: { id: string; name: string };
  onSuccess: () => void;
}

interface AllocationItem {
  id: string;
  inventory_id: string;
  quantity_allocated: number;
  quantity_sold: number;
  quantity_returned: number;
  counted_return: number | null;
  divergence: number | null;
  inventory: {
    product_style: string;
    color: string;
    size: string;
  } | null;
}

export function ReturnStockModal({ open, onOpenChange, event, onSuccess }: ReturnStockModalProps) {
  const [loading, setLoading] = useState(false);
  const [showExpected, setShowExpected] = useState(false);
  const [countedValues, setCountedValues] = useState<Record<string, number>>({});
  const [divergenceNotes, setDivergenceNotes] = useState("");
  const [step, setStep] = useState<"counting" | "review">("counting");
  const { toast } = useToast();

  // Buscar alocações do evento com estoque pendente
  const { data: allocations, refetch } = useQuery({
    queryKey: ["event_allocations_blind", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_stock_allocations")
        .select(`
          *,
          inventory:inventory_id (
            product_style,
            color,
            size
          )
        `)
        .eq("event_id", event.id);
      if (error) throw error;
      // Filtrar apenas alocações com itens pendentes de retorno
      return (data as AllocationItem[])?.filter(
        (a) => a.quantity_allocated - a.quantity_sold - a.quantity_returned > 0
      ) || [];
    },
    enabled: open,
  });

  // Reset ao abrir modal
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep("counting");
      setShowExpected(false);
      setCountedValues({});
      setDivergenceNotes("");
    }
    onOpenChange(isOpen);
  };

  // Calcular divergências
  const calculateDivergences = () => {
    if (!allocations) return [];
    
    return allocations.map((alloc) => {
      const expected = alloc.quantity_allocated - alloc.quantity_sold - alloc.quantity_returned;
      const counted = countedValues[alloc.id] ?? 0;
      const divergence = expected - counted; // Positivo = falta, Negativo = sobra
      
      return {
        ...alloc,
        expected,
        counted,
        divergence,
      };
    });
  };

  const divergences = calculateDivergences();
  const hasDivergence = divergences.some((d) => d.divergence !== 0);
  const totalDivergence = divergences.reduce((sum, d) => sum + Math.abs(d.divergence), 0);

  const handleCountChange = (allocationId: string, value: number) => {
    setCountedValues((prev) => ({
      ...prev,
      [allocationId]: Math.max(0, value),
    }));
  };

  const handleReview = () => {
    // Verificar se todas as contagens foram preenchidas
    const allCounted = allocations?.every((a) => countedValues[a.id] !== undefined);
    if (!allCounted) {
      toast({
        title: "Atenção",
        description: "Preencha a contagem de todas as peças antes de continuar.",
        variant: "destructive",
      });
      return;
    }
    setStep("review");
  };

  const handleSubmit = async () => {
    if (!allocations || allocations.length === 0) return;
    
    setLoading(true);
    try {
      // Processar cada alocação
      for (const alloc of divergences) {
        const counted = countedValues[alloc.id] ?? 0;
        
        if (counted > 0) {
          // Chamar RPC para retornar ao estoque
          const { error: rpcError } = await supabase.rpc("return_event_stock", {
            p_allocation_id: alloc.id,
            p_quantity_returned: counted,
          });
          
          if (rpcError) throw rpcError;
        }
        
        // Atualizar campos de auditoria
        const { error: updateError } = await supabase
          .from("event_stock_allocations")
          .update({
            counted_return: counted,
            divergence: alloc.divergence,
            divergence_notes: alloc.divergence !== 0 ? divergenceNotes : null,
            return_confirmed_at: new Date().toISOString(),
          })
          .eq("id", alloc.id);
        
        if (updateError) throw updateError;
      }

      toast({
        title: "Sucesso",
        description: hasDivergence 
          ? `Retorno registrado com ${totalDivergence} peças em divergência.`
          : "Todas as peças retornadas ao estoque sem divergências.",
      });
      
      onSuccess();
      handleOpenChange(false);
    } catch (error: any) {
      console.error("Error returning stock:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar retorno de estoque.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Auditoria de Retorno - Contagem Cega
          </DialogTitle>
          <DialogDescription>
            Evento: {event.name}
          </DialogDescription>
        </DialogHeader>

        {step === "counting" ? (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Contagem Cega</AlertTitle>
              <AlertDescription>
                Conte fisicamente cada produto e insira a quantidade. A quantidade esperada está oculta para evitar viés na contagem.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExpected(!showExpected)}
                className="gap-2"
              >
                {showExpected ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showExpected ? "Ocultar Esperado" : "Mostrar Esperado"}
              </Button>
            </div>

            <div className="space-y-3">
              {allocations?.map((alloc) => {
                const inv = alloc.inventory;
                const expected = alloc.quantity_allocated - alloc.quantity_sold - alloc.quantity_returned;
                
                return (
                  <div key={alloc.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {inv?.product_style} - {inv?.color}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tamanho: {inv?.size}
                        </p>
                      </div>
                      {showExpected && (
                        <Badge variant="secondary">
                          Esperado: {expected}
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor={`count-${alloc.id}`}>Quantidade Contada</Label>
                      <Input
                        id={`count-${alloc.id}`}
                        type="number"
                        min={0}
                        placeholder="Insira a contagem física"
                        value={countedValues[alloc.id] ?? ""}
                        onChange={(e) => handleCountChange(alloc.id, parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleReview} disabled={!allocations?.length}>
                Revisar Contagem
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {hasDivergence ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Divergência Detectada!</AlertTitle>
                <AlertDescription>
                  Foram encontradas {totalDivergence} peça(s) em divergência. Revise os itens abaixo.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950/30">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Sem Divergências</AlertTitle>
                <AlertDescription>
                  Todas as contagens correspondem ao esperado.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              {divergences.map((item) => {
                const inv = item.inventory;
                
                return (
                  <div 
                    key={item.id} 
                    className={`p-4 border rounded-lg flex justify-between items-center ${
                      item.divergence !== 0 
                        ? "border-destructive bg-destructive/5" 
                        : "border-green-500 bg-green-50 dark:bg-green-950/30"
                    }`}
                  >
                    <div>
                      <p className="font-medium">
                        {inv?.product_style} - {inv?.color} - {inv?.size}
                      </p>
                      <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                        <span>Esperado: {item.expected}</span>
                        <span>Contado: {item.counted}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {item.divergence === 0 ? (
                        <Badge className="bg-green-600">OK</Badge>
                      ) : item.divergence > 0 ? (
                        <Badge variant="destructive">
                          Falta: {item.divergence}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Sobra: {Math.abs(item.divergence)}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {hasDivergence && (
              <div className="space-y-2">
                <Label htmlFor="divergence-notes">Observações sobre Divergência</Label>
                <Textarea
                  id="divergence-notes"
                  placeholder="Descreva possíveis motivos para a divergência..."
                  value={divergenceNotes}
                  onChange={(e) => setDivergenceNotes(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep("counting")}>
                Voltar à Contagem
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  variant={hasDivergence ? "destructive" : "default"}
                >
                  {loading ? "Processando..." : hasDivergence ? "Confirmar com Divergência" : "Confirmar Retorno"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
