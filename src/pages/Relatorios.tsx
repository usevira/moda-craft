import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as PieChartComponent, Pie, Cell } from "recharts";

const Relatorios = () => {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: salesData } = useQuery({
    queryKey: ["sales-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          sales_items (qty, unit_price)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: inventoryData } = useQuery({
    queryKey: ["inventory-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*");
      
      if (error) throw error;
      return data;
    },
  });

  // Mock data for charts
  const monthlySalesData = [
    { month: 'Jan', vendas: 4500, lucro: 1200 },
    { month: 'Fev', vendas: 5200, lucro: 1500 },
    { month: 'Mar', vendas: 4800, lucro: 1300 },
    { month: 'Abr', vendas: 6100, lucro: 1800 },
    { month: 'Mai', vendas: 5800, lucro: 1650 },
    { month: 'Jun', vendas: 7200, lucro: 2100 },
  ];

  const categoryData = [
    { name: 'Camisetas', value: 35, color: '#8884d8' },
    { name: 'Vestidos', value: 25, color: '#82ca9d' },
    { name: 'Calças', value: 20, color: '#ffc658' },
    { name: 'Acessórios', value: 20, color: '#ff7300' },
  ];

  const totalReports = reports?.length || 0;
  const totalSales = salesData?.length || 0;
  const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
  const totalProducts = inventoryData?.length || 0;

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
            <h1 className="text-3xl font-bold">Relatórios e Análises</h1>
            <p className="text-muted-foreground">
              Insights e métricas do seu negócio
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Período
            </Button>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Relatórios</p>
                  <p className="text-2xl font-bold">{totalReports}</p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vendas Analisadas</p>
                  <p className="text-2xl font-bold">{totalSales}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Faturamento</p>
                  <p className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Produtos</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
                <PieChart className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="custom">Personalizados</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Vendas Mensais</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlySalesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`R$ ${value}`, '']} />
                      <Bar dataKey="vendas" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChartComponent>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                    </PieChartComponent>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Produtos Mais Vendidos</h4>
                    <div className="space-y-2">
                      {["Camiseta Básica Preta P", "Vestido Verão Azul M", "Calça Jeans Escura G"].map((product, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm">{product}</span>
                          <Badge>{(120 - i * 20)} vendas</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lucro Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`R$ ${value}`, 'Lucro']} />
                    <Bar dataKey="lucro" fill="hsl(var(--success))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {reports?.slice(0, 4).map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {report.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Criado em {report.created_at ? new Date(report.created_at).toLocaleDateString('pt-BR') : '-'}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                      <Button size="sm">
                        Visualizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Relatorios;