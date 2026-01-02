import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileText, Calculator } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface CreateCommissionStatementModalProps {
  children?: React.ReactNode;
}

export function CreateCommissionStatementModal({ children }: CreateCommissionStatementModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedRepresentative, setSelectedRepresentative] = useState('');
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  // Fetch resellers (customers with type 'reseller')
  const { data: resellers } = useQuery({
    queryKey: ['resellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('type', 'reseller');
      if (error) throw error;
      return data;
    },
  });

  // Calculate sales for the selected representative in the period
  const { data: salesData, isLoading: isCalculating } = useQuery({
    queryKey: ['representative-sales', selectedRepresentative, periodStart, periodEnd],
    queryFn: async () => {
      if (!selectedRepresentative) return null;

      // Get consignment items sold by this representative in the period
      const { data: consignments, error } = await supabase
        .from('consignments')
        .select(`
          id,
          created_at,
          consignment_items (
            id,
            product_name,
            quantity,
            sold,
            remaining
          )
        `)
        .eq('partner_id', selectedRepresentative)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd + 'T23:59:59');

      if (error) throw error;

      // Calculate total sold and estimate value
      let totalSold = 0;
      consignments?.forEach(c => {
        c.consignment_items?.forEach(item => {
          totalSold += item.sold || 0;
        });
      });

      // Get average product price for estimation
      const { data: products } = await supabase
        .from('products')
        .select('sale_price')
        .limit(10);

      const avgPrice = products?.length 
        ? products.reduce((sum, p) => sum + Number(p.sale_price), 0) / products.length 
        : 50;

      const totalSales = totalSold * avgPrice;
      const commissionRate = 0.40;
      const commissionAmount = totalSales * commissionRate;
      const netAmount = totalSales - commissionAmount;

      return {
        totalSold,
        totalSales,
        commissionRate,
        commissionAmount,
        netAmount,
      };
    },
    enabled: !!selectedRepresentative && !!periodStart && !!periodEnd,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!salesData) throw new Error('Dados de vendas não calculados');

      const { error } = await supabase.from('commission_statements').insert({
        representative_id: selectedRepresentative,
        period_start: periodStart,
        period_end: periodEnd,
        total_sales: salesData.totalSales,
        commission_rate: salesData.commissionRate,
        commission_amount: salesData.commissionAmount,
        net_amount: salesData.netAmount,
        notes,
        status: 'pending',
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Prestação de contas criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['commission-statements'] });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao criar prestação de contas: ' + error.message);
    },
  });

  const resetForm = () => {
    setSelectedRepresentative('');
    setPeriodStart(format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
    setPeriodEnd(format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
    setNotes('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Nova Prestação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Prestação de Contas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Representante</Label>
            <Select value={selectedRepresentative} onValueChange={setSelectedRepresentative}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o representante" />
              </SelectTrigger>
              <SelectContent>
                {resellers?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início do Período</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fim do Período</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          {selectedRepresentative && salesData && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calculator className="h-4 w-4" />
                Resumo do Período
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Itens Vendidos:</span>
                <span className="font-medium">{salesData.totalSold}</span>
                
                <span className="text-muted-foreground">Total Vendas:</span>
                <span className="font-medium">{formatCurrency(salesData.totalSales)}</span>
                
                <span className="text-muted-foreground">Comissão (40%):</span>
                <span className="font-medium text-green-600">{formatCurrency(salesData.commissionAmount)}</span>
                
                <span className="text-muted-foreground">Valor Líquido:</span>
                <span className="font-medium">{formatCurrency(salesData.netAmount)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!selectedRepresentative || !salesData || createMutation.isPending}
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Prestação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
