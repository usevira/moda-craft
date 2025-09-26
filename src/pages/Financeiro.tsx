import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Financeiro = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: sales } = useQuery({
    queryKey: ["sales-financial"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "income":
        return <Badge className="bg-success/20 text-success">Entrada</Badge>;
      case "expense":
        return <Badge className="bg-destructive/20 text-destructive">Saída</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      'vendas': 'bg-success/20 text-success',
      'material': 'bg-warning/20 text-warning',
      'marketing': 'bg-primary/20 text-primary',
      'operacional': 'bg-muted/20 text-muted-foreground',
    };
    
    return (
      <Badge className={colors[category as keyof typeof colors] || 'bg-muted/20 text-muted-foreground'}>
        {category}
      </Badge>
    );
  };

  // Calculate metrics
  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  
  // This month calculations (mock for now)
  const thisMonth = new Date();
  const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
  const thisMonthTransactions = transactions?.filter(t => t.date && new Date(t.date) >= monthStart) || [];
  const monthlyIncome = thisMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const monthlyExpenses = thisMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid gap-4 md:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Gestão Financeira</h1>
            <p className="text-muted-foreground">
              Controle de fluxo de caixa e resultados
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Relatórios
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receitas Total</p>
                  <p className="text-2xl font-bold text-success">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Despesas Total</p>
                  <p className="text-2xl font-bold text-destructive">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lucro Líquido</p>
                  <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className={`w-8 h-8 ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Margem de Lucro</p>
                  <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {profitMargin.toFixed(1)}%
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Summary */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receitas do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success mb-2">
                R$ {monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground">
                {thisMonthTransactions.filter(t => t.type === 'income').length} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Despesas do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive mb-2">
                R$ {monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground">
                {thisMonthTransactions.filter(t => t.type === 'expense').length} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saldo do Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold mb-2 ${(monthlyIncome - monthlyExpenses) >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {(monthlyIncome - monthlyExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground">
                Resultado mensal atual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.slice(0, 20).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {transaction.date ? new Date(transaction.date).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>{getTypeBadge(transaction.type || '')}</TableCell>
                    <TableCell>{getCategoryBadge(transaction.category || '')}</TableCell>
                    <TableCell className="font-medium">
                      {transaction.notes || 'Sem descrição'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'} R$ {(transaction.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Financeiro;