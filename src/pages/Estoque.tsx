import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Filter,
  Package,
  AlertTriangle,
  TrendingDown
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const getStatusBadge = (quantity: number | null) => {
  const stock = quantity || 0;
  if (stock === 0) {
    return <Badge className="bg-destructive/20 text-destructive">Zerado</Badge>;
  }
  if (stock > 0 && stock <= 5) { // Assuming 5 is the low stock threshold
    return <Badge className="bg-warning/20 text-warning">Baixo</Badge>;
  }
  return <Badge className="bg-success/20 text-success">Normal</Badge>;
};

const Estoque = () => {
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products (*)
        `);
      
      if (error) throw error;
      return data;
    },
  });

  const totalItens = inventory?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;
  const itensBaixo = inventory?.filter(item => (item.quantity || 0) > 0 && (item.quantity || 0) <= 5).length || 0;
  const itensZerados = inventory?.filter(item => (item.quantity || 0) === 0).length || 0;
  const valorTotal = inventory?.reduce((acc, item) => {
    const cost = item.products?.base_cost || 0;
    const quantity = item.quantity || 0;
    return acc + (quantity * cost);
  }, 0) || 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
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
            <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
            <p className="text-muted-foreground">
              Controle completo do seu inventário
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Item ao Estoque
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Itens</p>
                  <p className="text-2xl font-bold">{totalItens}</p>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-warning">{itensBaixo}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Itens Zerados</p>
                  <p className="text-2xl font-bold text-destructive">{itensZerados}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor de Custo Total</p>
                  <p className="text-2xl font-bold">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <Package className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Inventário Detalhado</CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar produtos..." className="pl-10 w-64" />
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Cor/Tamanho</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo Unit.</TableHead>
                  <TableHead className="text-right">Preço Venda</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.products?.sku || 'N/A'}</TableCell>
                    <TableCell className="font-medium">{item.products?.name || 'Produto não encontrado'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.color}</span>
                        <Badge variant="outline" className="text-xs">{item.size}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                    <TableCell className="text-right">R$ {(item.products?.base_cost || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">R$ {(item.products?.sale_price || 0).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(item.quantity)}</TableCell>
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

export default Estoque;

