import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Factory,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  // Fetch sales data
  const { data: salesData } = useQuery({
    queryKey: ["dashboard-sales"],
    queryFn: async () => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      const { data: currentMonth } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", firstDayOfMonth.toISOString());
      
      const { data: previousMonth } = await supabase
        .from("sales")
        .select("total")
        .gte("created_at", lastMonth.toISOString())
        .lt("created_at", firstDayOfMonth.toISOString());
      
      const currentTotal = currentMonth?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const previousTotal = previousMonth?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
      const change = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1) : "0";
      
      return {
        current: currentTotal,
        previous: previousTotal,
        change: parseFloat(change),
        count: currentMonth?.length || 0
      };
    },
  });

  // Fetch inventory data
  const { data: inventoryData } = useQuery({
    queryKey: ["dashboard-inventory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory")
        .select("quantity, min_stock");
      
      const total = data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const lowStock = data?.filter(item => (item.quantity || 0) <= (item.min_stock || 0)).length || 0;
      
      return { total, lowStock };
    },
  });

  // Fetch batches for production status
  const { data: batchesData } = useQuery({
    queryKey: ["dashboard-batches"],
    queryFn: async () => {
      const { data } = await supabase
        .from("batches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      
      return data || [];
    },
  });

  const salesTotal = salesData?.current || 0;
  const salesChange = salesData?.change || 0;
  const salesCount = salesData?.count || 0;
  const inventoryTotal = inventoryData?.total || 0;
  const lowStockCount = inventoryData?.lowStock || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu negócio de moda
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Vendas do Mês"
            value={`R$ ${salesTotal.toFixed(2)}`}
            change={`${salesChange >= 0 ? '+' : ''}${salesChange}%`}
            changeType={salesChange >= 0 ? "positive" : "negative"}
            icon={DollarSign}
            description="vs mês anterior"
          />
          <MetricCard
            title="Produtos em Estoque"
            value={inventoryTotal.toString()}
            change={lowStockCount > 0 ? `${lowStockCount} baixo` : "OK"}
            changeType={lowStockCount > 0 ? "negative" : "positive"}
            icon={Package}
            description="itens disponíveis"
          />
          <MetricCard
            title="Pedidos Este Mês"
            value={salesCount.toString()}
            change={salesChange >= 0 ? `+${salesChange}%` : `${salesChange}%`}
            changeType={salesChange >= 0 ? "positive" : "negative"}
            icon={ShoppingCart}
            description="pedidos processados"
          />
          <MetricCard
            title="Alertas"
            value={lowStockCount.toString()}
            change={lowStockCount > 0 ? "Atenção" : "Tudo OK"}
            changeType={lowStockCount > 0 ? "negative" : "positive"}
            icon={AlertTriangle}
            description="itens em estoque baixo"
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid gap-6 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <SalesChart />
          </div>
          <div className="lg:col-span-3">
            <RecentActivity />
          </div>
        </div>

        {/* Production and Alerts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Production Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="w-5 h-5" />
                Status da Produção
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {batchesData && batchesData.length > 0 ? (
                batchesData.map((batch) => {
                  const progress = batch.status === 'completed' ? 100 : batch.status === 'in_progress' ? 50 : 20;
                  return (
                    <div key={batch.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{batch.batch_number} - {batch.product_name}</span>
                        <span className={progress === 100 ? "text-success" : "text-primary"}>
                          {progress}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum lote em produção</p>
              )}
            </CardContent>
          </Card>

          {/* Alerts and Warnings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Alertas do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lowStockCount > 0 && (
                <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Estoque Baixo</p>
                    <p className="text-xs text-muted-foreground">
                      {lowStockCount} {lowStockCount === 1 ? 'item com' : 'itens com'} estoque crítico
                    </p>
                  </div>
                </div>
              )}
              {salesChange > 0 && (
                <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
                  <TrendingUp className="w-4 h-4 text-success mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Vendas em Alta</p>
                    <p className="text-xs text-muted-foreground">
                      Crescimento de {salesChange.toFixed(1)}% vs mês anterior
                    </p>
                  </div>
                </div>
              )}
              {lowStockCount === 0 && salesChange <= 0 && (
                <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <Package className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Sistema OK</p>
                    <p className="text-xs text-muted-foreground">
                      Nenhum alerta no momento
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
