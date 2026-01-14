import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Target, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

interface EventWithFinancials {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  totalSales: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  itemsSold: number;
  itemsAllocated: number;
  hasDivergence: boolean;
}

export function EventProfitDashboard() {
  // Buscar eventos
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events_stock_profit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events_stock")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Buscar vendas de eventos (canal "event")
  const { data: eventSales, isLoading: salesLoading } = useQuery({
    queryKey: ["event-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("channel", "event");
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar transações vinculadas a eventos
  const { data: eventTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["event-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .not("event_id", "is", null);
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar alocações para calcular vendas por evento
  const { data: allocations, isLoading: allocationsLoading } = useQuery({
    queryKey: ["event_allocations_profit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_stock_allocations")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = eventsLoading || salesLoading || transactionsLoading || allocationsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  // Calcular financeiros por evento
  const eventsWithFinancials: EventWithFinancials[] = (events || []).map((event) => {
    // Alocações deste evento
    const eventAllocations = allocations?.filter((a) => a.event_id === event.id) || [];
    const itemsSold = eventAllocations.reduce((sum, a) => sum + (a.quantity_sold || 0), 0);
    const itemsAllocated = eventAllocations.reduce((sum, a) => sum + (a.quantity_allocated || 0), 0);
    const hasDivergence = eventAllocations.some((a) => (a.divergence || 0) !== 0);

    // Transações vinculadas diretamente ao evento
    const linkedTransactions = eventTransactions?.filter((t) => t.event_id === event.id) || [];
    
    // Receitas (vendas)
    const salesFromTransactions = toFixedNumber(
      linkedTransactions
        .filter((t) => t.type === "income" || t.dre_category === "sales")
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    );

    // Despesas
    const expensesFromTransactions = toFixedNumber(
      linkedTransactions
        .filter((t) => t.type === "expense" && t.cash_impact !== false)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    );

    // Lucro
    const profit = toFixedNumber(salesFromTransactions - expensesFromTransactions);
    const profitMargin = salesFromTransactions > 0 
      ? toFixedNumber((profit / salesFromTransactions) * 100) 
      : 0;

    return {
      id: event.id,
      name: event.name,
      location: event.location,
      start_date: event.start_date,
      end_date: event.end_date,
      status: event.status,
      totalSales: salesFromTransactions,
      totalExpenses: expensesFromTransactions,
      profit,
      profitMargin,
      itemsSold,
      itemsAllocated,
      hasDivergence,
    };
  });

  // Totais consolidados
  const totalSalesAll = toFixedNumber(eventsWithFinancials.reduce((sum, e) => sum + e.totalSales, 0));
  const totalExpensesAll = toFixedNumber(eventsWithFinancials.reduce((sum, e) => sum + e.totalExpenses, 0));
  const totalProfitAll = toFixedNumber(totalSalesAll - totalExpensesAll);
  const avgProfitMargin = totalSalesAll > 0 ? toFixedNumber((totalProfitAll / totalSalesAll) * 100) : 0;
  const totalItemsSold = eventsWithFinancials.reduce((sum, e) => sum + e.itemsSold, 0);

  // Dados para o gráfico (últimos 10 eventos com dados)
  const chartData = eventsWithFinancials
    .filter((e) => e.totalSales > 0 || e.totalExpenses > 0)
    .slice(0, 10)
    .reverse()
    .map((e) => ({
      name: e.name.length > 15 ? e.name.substring(0, 15) + "..." : e.name,
      fullName: e.name,
      receita: e.totalSales,
      despesas: e.totalExpenses,
      lucro: e.profit,
    }));

  // Eventos com melhor e pior performance
  const sortedByProfit = [...eventsWithFinancials].sort((a, b) => b.profit - a.profit);
  const bestEvent = sortedByProfit[0];
  const worstEvent = sortedByProfit[sortedByProfit.length - 1];

  return (
    <div className="space-y-6">
      {/* Cards resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalSalesAll)}</div>
            <p className="text-xs text-muted-foreground">{eventsWithFinancials.length} eventos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpensesAll)}</div>
            <p className="text-xs text-muted-foreground">Custos operacionais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Real</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfitAll >= 0 ? "text-green-600" : "text-destructive"}`}>
              {formatCurrency(totalProfitAll)}
            </div>
            <Badge variant={totalProfitAll >= 0 ? "default" : "destructive"} className="mt-1">
              Margem: {avgProfitMargin.toFixed(1)}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Peças Vendidas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItemsSold}</div>
            <p className="text-xs text-muted-foreground">Em todos os eventos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico comparativo */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Financeira por Evento
            </CardTitle>
            <CardDescription>Receita, despesas e lucro dos últimos eventos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} interval={0} fontSize={12} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} fontSize={11} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "receita" ? "Receita" : name === "despesas" ? "Despesas" : "Lucro",
                  ]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                />
                <Bar dataKey="receita" fill="hsl(142, 76%, 36%)" name="Receita" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill="hsl(0, 84%, 60%)" name="Despesas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lucro" name="Lucro" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.lucro >= 0 ? "hsl(var(--primary))" : "hsl(0, 84%, 60%)"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detalhamento por evento */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Melhor evento */}
        {bestEvent && bestEvent.profit > 0 && (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <TrendingUp className="h-5 w-5" />
                Melhor Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-lg font-semibold">{bestEvent.name}</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lucro:</span>
                <span className="font-bold text-green-600">{formatCurrency(bestEvent.profit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margem:</span>
                <span className="font-medium">{bestEvent.profitMargin.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Peças vendidas:</span>
                <span className="font-medium">{bestEvent.itemsSold}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pior evento */}
        {worstEvent && worstEvent.profit < 0 && (
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <TrendingDown className="h-5 w-5" />
                Evento com Prejuízo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-lg font-semibold">{worstEvent.name}</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Prejuízo:</span>
                <span className="font-bold text-destructive">{formatCurrency(worstEvent.profit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Receita:</span>
                <span className="font-medium">{formatCurrency(worstEvent.totalSales)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Despesas:</span>
                <span className="font-medium">{formatCurrency(worstEvent.totalExpenses)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lista de todos os eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Evento</CardTitle>
          <CardDescription>Performance financeira individual</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsWithFinancials.length === 0 ? (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">Nenhum evento encontrado. Crie eventos e vincule transações para ver o lucro real.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {eventsWithFinancials.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.name}</span>
                      {event.hasDivergence && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Divergência
                        </Badge>
                      )}
                      <Badge variant={
                        event.status === "active" ? "default" :
                        event.status === "completed" ? "outline" : "secondary"
                      }>
                        {event.status === "active" ? "Ativo" : 
                         event.status === "completed" ? "Concluído" : "Planejado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.location || "Sem local definido"}</p>
                  </div>
                  
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Receita</p>
                      <p className="font-medium text-green-600">{formatCurrency(event.totalSales)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Despesas</p>
                      <p className="font-medium text-destructive">{formatCurrency(event.totalExpenses)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lucro</p>
                      <p className={`font-bold ${event.profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                        {formatCurrency(event.profit)}
                      </p>
                    </div>
                    <div className="w-16">
                      <p className="text-xs text-muted-foreground">Margem</p>
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        <span className={`font-medium ${event.profitMargin >= 0 ? "text-green-600" : "text-destructive"}`}>
                          {event.profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
