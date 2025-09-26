import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Package
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

const Vendas = () => {
  const { data: sales, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          customers (name, type),
          sales_items (
            qty,
            unit_price,
            product_id,
            size,
            color
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: consignments } = useQuery({
    queryKey: ["consignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consignments")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "direct":
        return <Badge className="bg-primary/20 text-primary">Direta</Badge>;
      case "consignment":
        return <Badge className="bg-warning/20 text-warning">Consignação</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const totalSales = sales?.length || 0;
  const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0;
  const totalCustomers = customers?.length || 0;
  const openConsignments = consignments?.filter(c => c.status === "open").length || 0;
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

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
            <h1 className="text-3xl font-bold">Gestão de Vendas</h1>
            <p className="text-muted-foreground">
              Controle de vendas diretas e consignações
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Package className="w-4 h-4" />
              Nova Consignação
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Venda
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Vendas</p>
                  <p className="text-2xl font-bold">{totalSales}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-primary" />
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
                <DollarSign className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">R$ {avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                  <p className="text-2xl font-bold">{totalCustomers}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Consignações</p>
                  <p className="text-2xl font-bold text-warning">{openConsignments}</p>
                </div>
                <Package className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venda</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm">#{sale.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">
                      {sale.customers?.name || "Cliente não informado"}
                    </TableCell>
                    <TableCell>{getTypeBadge(sale.type || 'direct')}</TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {(sale.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {sale.sales_items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0} itens
                    </TableCell>
                    <TableCell>
                      {sale.created_at ? new Date(sale.created_at).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Consignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Consignações em Aberto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {consignments?.filter(c => c.status === "open").slice(0, 6).map((consignment) => (
                <div key={consignment.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">#{consignment.id.slice(0, 8)}</h4>
                    <Badge className="bg-warning/20 text-warning">Aberto</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {consignment.items ? 
                      `${Array.isArray(consignment.items) ? consignment.items.length : 0} itens` 
                      : '0 itens'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {consignment.created_at ? new Date(consignment.created_at).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Vendas;