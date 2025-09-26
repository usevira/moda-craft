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

const Index = () => {
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
            value="R$ 24.580"
            change="+12.5%"
            changeType="positive"
            icon={DollarSign}
            description="vs mês anterior"
          />
          <MetricCard
            title="Produtos em Estoque"
            value="1.247"
            change="-3.2%"
            changeType="negative"
            icon={Package}
            description="itens disponíveis"
          />
          <MetricCard
            title="Pedidos Este Mês"
            value="89"
            change="+8.7%"
            changeType="positive"
            icon={ShoppingCart}
            description="pedidos processados"
          />
          <MetricCard
            title="Margem de Lucro"
            value="64.2%"
            change="+2.1%"
            changeType="positive"
            icon={TrendingUp}
            description="média mensal"
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
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Lote #001 - Camisetas Básicas</span>
                  <span className="text-success">100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Lote #002 - Vestidos Verão</span>
                  <span className="text-primary">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Lote #003 - Calças Jeans</span>
                  <span className="text-muted-foreground">45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
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
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Estoque Baixo</p>
                  <p className="text-xs text-muted-foreground">
                    3 materiais com estoque crítico
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-primary-muted rounded-lg border border-primary/20">
                <Package className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Reposição Sugerida</p>
                  <p className="text-xs text-muted-foreground">
                    5 produtos com demanda alta
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg border border-success/20">
                <TrendingUp className="w-4 h-4 text-success mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Meta Atingida</p>
                  <p className="text-xs text-muted-foreground">
                    Vendas do mês superaram expectativa
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
