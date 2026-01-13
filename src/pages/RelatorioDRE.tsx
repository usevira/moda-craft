import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Wallet, PieChart as PieChartIcon, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

// Cores para o gráfico
const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--secondary))"];

// Helper para cálculos financeiros precisos (evitar erros de ponto flutuante)
const toFixedNumber = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function RelatorioDRE() {
  const [periodoFilter, setPeriodoFilter] = useState<string>("all");

  // Buscar transações
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["dre-transactions", periodoFilter],
    queryFn: async () => {
      let query = supabase.from("transactions").select("*");
      
      if (periodoFilter !== "all") {
        const now = new Date();
        let startDate: Date;
        
        switch (periodoFilter) {
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "quarter":
            startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            break;
          case "year":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        query = query.gte("date", startDate.toISOString().split("T")[0]);
      }
      
      const { data, error } = await query.order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Cálculos DRE com precisão
  const salesTotal = toFixedNumber(
    transactions?.filter((t) => t.dre_category === "sales" || t.type === "income").reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0
  );

  const operationalCosts = toFixedNumber(
    transactions?.filter((t) => t.dre_category === "operational_cost" && t.cash_impact).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0
  );

  const cogs = toFixedNumber(
    transactions?.filter((t) => t.dre_category === "cogs").reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0
  );

  const otherExpenses = toFixedNumber(
    transactions?.filter((t) => t.type === "expense" && !t.dre_category).reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0
  );

  const totalExpenses = toFixedNumber(operationalCosts + cogs + otherExpenses);
  const cashResult = toFixedNumber(salesTotal - totalExpenses);
  const profitMargin = salesTotal > 0 ? toFixedNumber((cashResult / salesTotal) * 100) : 0;

  // Dados para o gráfico de pizza
  const pieData = [
    { name: "Custos Operacionais", value: operationalCosts, category: "operational_cost" },
    { name: "CMV (Custo Mercadoria)", value: cogs, category: "cogs" },
    { name: "Outras Despesas", value: otherExpenses, category: "other" },
  ].filter((item) => item.value > 0);

  // Agrupar por categoria de custo
  const costsByCategory = transactions
    ?.filter((t) => t.type === "expense" || t.dre_category !== "sales")
    .reduce((acc: Record<string, number>, t) => {
      const category = t.category || "Sem categoria";
      acc[category] = toFixedNumber((acc[category] || 0) + (Number(t.amount) || 0));
      return acc;
    }, {}) || {};

  const barData = Object.entries(costsByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <DashboardLayout>
      <div className="flex-1 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Relatório DRE</h1>
            <p className="text-muted-foreground">Demonstração do Resultado do Exercício</p>
          </div>
          <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Operacional</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(salesTotal)}</div>
              <p className="text-xs text-muted-foreground">Vendas e outras receitas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-muted-foreground">Operacionais + CMV</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resultado de Caixa</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${cashResult >= 0 ? "text-green-600" : "text-destructive"}`}>
                {formatCurrency(cashResult)}
              </div>
              <Badge variant={cashResult >= 0 ? "default" : "destructive"} className="mt-1">
                {cashResult >= 0 ? "Lucro" : "Prejuízo"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profitMargin >= 0 ? "text-green-600" : "text-destructive"}`}>
                {profitMargin.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Sobre a receita</p>
            </CardContent>
          </Card>
        </div>

        {/* DRE detalhado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                DRE Detalhado
              </CardTitle>
              <CardDescription>Breakdown financeiro por categoria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <span className="font-medium">Receita Operacional</span>
                  <span className="text-green-600 font-bold">{formatCurrency(salesTotal)}</span>
                </div>
                
                <div className="pl-4 space-y-1 border-l-2 border-destructive/30 ml-2">
                  <div className="flex justify-between items-center p-2 text-sm">
                    <span className="text-muted-foreground">(-) Custos Operacionais</span>
                    <span className="text-destructive">{formatCurrency(operationalCosts)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 text-sm">
                    <span className="text-muted-foreground">(-) CMV (Custo Mercadoria)</span>
                    <span className="text-destructive">{formatCurrency(cogs)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 text-sm">
                    <span className="text-muted-foreground">(-) Outras Despesas</span>
                    <span className="text-destructive">{formatCurrency(otherExpenses)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted rounded-lg border-2 border-primary">
                  <span className="font-bold">= Resultado de Caixa</span>
                  <span className={`font-bold text-lg ${cashResult >= 0 ? "text-green-600" : "text-destructive"}`}>
                    {formatCurrency(cashResult)}
                  </span>
                </div>
              </div>

              {transactions?.length === 0 && (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm">Nenhuma transação registrada. Adicione transações com categoria DRE para ver o relatório.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de distribuição de custos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Distribuição de Custos
              </CardTitle>
              <CardDescription>Breakdown visual por tipo de custo</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  Sem dados de custo para exibir
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de barras por categoria */}
        {barData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
              <CardDescription>Top 8 categorias de despesa</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
                  <YAxis type="category" dataKey="name" width={90} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="value" fill="hsl(var(--primary))" name="Valor" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
