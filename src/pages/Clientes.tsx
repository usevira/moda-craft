import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddCustomerModal } from "@/components/customers/AddCustomerModal";
import { 
  Plus, 
  Search,
  Filter,
  Users,
  Store,
  Phone,
  Mail
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

const Clientes = () => {
  const { data: customers, isLoading } = useQuery({
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

  // Get sales count for each customer
  const { data: customerSales } = useQuery({
    queryKey: ["customer-sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("customer_id, total")
        .not("customer_id", "is", null);
      
      if (error) throw error;
      return data;
    },
  });

  const getCustomerStats = (customerId: string) => {
    const sales = customerSales?.filter(sale => sale.customer_id === customerId) || [];
    const totalSales = sales.length;
    const totalValue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    return { totalSales, totalValue };
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "consumer":
        return <Badge className="bg-primary/20 text-primary">Consumidor</Badge>;
      case "retailer":
        return <Badge className="bg-success/20 text-success">Revendedor</Badge>;
      case "wholesale":
        return <Badge className="bg-warning/20 text-warning">Atacado</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const totalCustomers = customers?.length || 0;
  const retailers = customers?.filter(c => c.type === "retailer").length || 0;
  const consumers = customers?.filter(c => c.type === "consumer").length || 0;
  const wholesale = customers?.filter(c => c.type === "wholesale").length || 0;

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
            <h1 className="text-3xl font-bold">Gestão de Clientes</h1>
            <p className="text-muted-foreground">
              Controle de relacionamento com clientes e vendedores
            </p>
          </div>
          <AddCustomerModal />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Clientes</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Consumidores</p>
                  <p className="text-2xl font-bold text-primary">{consumers}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revendedores</p>
                  <p className="text-2xl font-bold text-success">{retailers}</p>
                </div>
                <Store className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Atacado</p>
                  <p className="text-2xl font-bold text-warning">{wholesale}</p>
                </div>
                <Store className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Clientes</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar clientes..." className="pl-10 w-64" />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Total Comprado</TableHead>
                  <TableHead>Cliente desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.map((customer) => {
                  const stats = getCustomerStats(customer.id);
                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{getTypeBadge(customer.type || 'consumer')}</TableCell>
                      <TableCell>
                        {customer.contact ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              {customer.contact.includes('@') ? (
                                <>
                                  <Mail className="w-3 h-3" />
                                  {customer.contact}
                                </>
                              ) : (
                                <>
                                  <Phone className="w-3 h-3" />
                                  {customer.contact}
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Não informado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{stats.totalSales} vendas</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Principais Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customers?.slice(0, 6).map((customer) => {
                const stats = getCustomerStats(customer.id);
                return (
                  <div key={customer.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{customer.name}</h4>
                      {getTypeBadge(customer.type || 'consumer')}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{stats.totalSales} vendas realizadas</p>
                      <p className="font-medium text-foreground">
                        R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Clientes;