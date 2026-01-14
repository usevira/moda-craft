import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenantId } from "@/hooks/useTenantId";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type DreCategory = "sales" | "operational_cost" | "cogs" | "";

const DRE_CATEGORIES: { value: DreCategory; label: string; description: string }[] = [
  { value: "sales", label: "Vendas", description: "Receita de vendas de produtos" },
  { value: "operational_cost", label: "Custo Operacional", description: "Uber, Hotel, Alimentação, etc" },
  { value: "cogs", label: "CMV - Custo Mercadoria", description: "Custo de produção/aquisição" },
];

const EXPENSE_CATEGORIES = [
  "Transporte",
  "Hospedagem",
  "Alimentação",
  "Material de Produção",
  "Embalagens",
  "Marketing",
  "Taxa de Cartão",
  "Comissão",
  "Aluguel",
  "Outros",
];

export function AddTransactionModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { tenantId } = useTenantId();
  const queryClient = useQueryClient();

  // Buscar eventos para vincular transação
  const { data: events } = useQuery({
    queryKey: ["events_stock_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events_stock")
        .select("id, name, start_date, status")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const [formData, setFormData] = useState({
    type: "income",
    category: "",
    dre_category: "" as DreCategory,
    cash_impact: true,
    amount: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
    event_id: "" as string,
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      type: "income",
      category: "",
      dre_category: "",
      cash_impact: true,
      amount: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
      event_id: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenantId) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado ou sem tenant associado.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Parse amount with precision
      const amount = Math.round(parseFloat(formData.amount.replace(",", ".")) * 100) / 100;

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Valor inválido");
      }

      const { error } = await supabase.from("transactions").insert([
        {
          type: formData.type,
          category: formData.category,
          dre_category: formData.dre_category || null,
          cash_impact: formData.cash_impact,
          amount,
          notes: formData.notes || null,
          date: formData.date,
          tenant_id: tenantId,
          event_id: formData.event_id || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Transação registrada",
        description: "Transação financeira registrada com sucesso!",
      });

      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dre-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["event-transactions"] });
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar transação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-set DRE category based on type
  const handleTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      type,
      dre_category: type === "income" ? "sales" : "operational_cost",
      category: "",
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Registrar Nova Transação
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Receita
                  </div>
                </SelectItem>
                <SelectItem value="expense">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    Despesa
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoria DRE */}
          <div>
            <Label htmlFor="dre_category">Classificação DRE</Label>
            <Select
              value={formData.dre_category}
              onValueChange={(value) => setFormData({ ...formData, dre_category: value as DreCategory })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a classificação" />
              </SelectTrigger>
              <SelectContent>
                {DRE_CATEGORIES.filter((cat) =>
                  formData.type === "income" ? cat.value === "sales" : cat.value !== "sales"
                ).map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div>
                      <span>{cat.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">({cat.description})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria descritiva */}
          <div>
            <Label htmlFor="category">Categoria</Label>
            {formData.type === "expense" ? (
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Venda Online, Venda Evento..."
                required
              />
            )}
          </div>

          {/* Impacto no Caixa */}
          {formData.type === "expense" && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <Label htmlFor="cash_impact" className="cursor-pointer">
                  Impacto no Caixa
                </Label>
                <p className="text-xs text-muted-foreground">
                  Desmarque se for um custo não-monetário (ex: depreciação)
                </p>
              </div>
              <Switch
                id="cash_impact"
                checked={formData.cash_impact}
                onCheckedChange={(checked) => setFormData({ ...formData, cash_impact: checked })}
              />
            </div>
          )}

          {/* Valor */}
          <div>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          {/* Evento vinculado */}
          <div>
            <Label htmlFor="event_id">Vincular a Evento (opcional)</Label>
            <Select
              value={formData.event_id}
              onValueChange={(value) => setFormData({ ...formData, event_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um evento (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem vínculo</SelectItem>
                {events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {event.name}
                      <span className="text-xs text-muted-foreground">
                        ({event.status === "active" ? "Ativo" : event.status === "completed" ? "Concluído" : "Planejado"})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Vincule para calcular o lucro real do evento
            </p>
          </div>

          {/* Data */}
          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais..."
            />
          </div>

          {/* Dica sobre DRE */}
          <Alert>
            <AlertDescription className="text-xs">
              💡 A classificação DRE permite gerar relatórios financeiros precisos. Use "Custo Operacional" para
              despesas como transporte e hospedagem, e "CMV" para custos de produção.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !tenantId}>
              {loading ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
