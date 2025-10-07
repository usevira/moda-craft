import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Filter,
  Package,
  AlertTriangle,
  TrendingDown,
  Shirt
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
import { AddInventoryModal } from "@/components/inventory/AddInventoryModal";

const getStatusBadge = (quantity: number | null, minStock: number | null = 5) => {
  const stock = quantity || 0;
  const min = minStock || 5;
  if (stock === 0) {
    return <Badge className="bg-destructive/20 text-destructive">Zerado</Badge>;
  }
  if (stock > 0 && stock <= min) {
    return <Badge className="bg-warning/20 text-warning">Baixo</Badge>;
  }
  return <Badge className="bg-success/20 text-success">Normal</Badge>;
};

const Estoque = () => {
  const { data: rawMaterials, isLoading: loadingRaw } = useQuery({
    queryKey: ["inventory", "raw_material"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products (*)
        `)
        .eq("inventory_type", "raw_material");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: finishedProducts, isLoading: loadingFinished } = useQuery({
    queryKey: ["inventory", "finished_product"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          products (*)
        `)
        .eq("inventory_type", "finished_product");
      
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingRaw || loadingFinished;
  const allInventory = [...(rawMaterials || []), ...(finishedProducts || [])];

  const totalItens = allInventory?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;
  const itensBaixo = allInventory?.filter(item => {
    const minStock = item.min_stock || 5;
    return (item.quantity || 0) > 0 && (item.quantity || 0) <= minStock;
  }).length || 0;
  const itensZerados = allInventory?.filter(item => (item.quantity || 0) === 0).length || 0;
  const valorTotal = allInventory?.reduce((acc, item) => {
    const cost = (item.products as any)?.base_cost || 0;
    const quantity = item.quantity || 0;
    return acc + (quantity * cost);
  }, 0) || 0;

  const totalRawMaterials = rawMaterials?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;
  const totalFinished = finishedProducts?.reduce((acc, item) => acc + (item.quantity || 0), 0) || 0;

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
          <AddInventoryModal />
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

        {/* Inventory Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Todos ({totalItens})</TabsTrigger>
            <TabsTrigger value="raw">Camisetas Lisas ({totalRawMaterials})</TabsTrigger>
            <TabsTrigger value="finished">Produtos Acabados ({totalFinished})</TabsTrigger>
            <TabsTrigger value="alerts">Alertas ({itensBaixo})</TabsTrigger>
          </TabsList>

          {/* All Inventory */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Inventário Completo</CardTitle>
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
                      <TableHead>Tipo</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Estilo</TableHead>
                      <TableHead>Cor/Tamanho</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allInventory?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant={item.inventory_type === 'raw_material' ? 'outline' : 'default'}>
                            {item.inventory_type === 'raw_material' ? 'Matéria-Prima' : 'Produto Acabado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{(item.products as any)?.sku || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{(item.products as any)?.name || 'Produto não encontrado'}</TableCell>
                        <TableCell>
                          {item.product_style && (
                            <div className="flex items-center gap-1">
                              <Shirt className="w-4 h-4" />
                              <span>{item.product_style}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.color}</span>
                            <Badge variant="outline" className="text-xs">{item.size}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.location || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                        <TableCell>{getStatusBadge(item.quantity, item.min_stock)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Raw Materials */}
          <TabsContent value="raw">
            <Card>
              <CardHeader>
                <CardTitle>Estoque de Camisetas Lisas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estilo</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Mín. Estoque</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rawMaterials?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shirt className="w-4 h-4" />
                            <span>{item.product_style || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.color}</TableCell>
                        <TableCell><Badge variant="outline">{item.size}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.location || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{item.min_stock || 5}</TableCell>
                        <TableCell>{getStatusBadge(item.quantity, item.min_stock)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finished Products */}
          <TabsContent value="finished">
            <Card>
              <CardHeader>
                <CardTitle>Estoque de Produtos Acabados</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Estilo</TableHead>
                      <TableHead>Cor/Tamanho</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finishedProducts?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{(item.products as any)?.sku || 'N/A'}</TableCell>
                        <TableCell className="font-medium">{(item.products as any)?.name || 'Produto não encontrado'}</TableCell>
                        <TableCell>{item.product_style || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.color}</span>
                            <Badge variant="outline" className="text-xs">{item.size}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.location || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">R$ {((item.products as any)?.sale_price || 0).toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(item.quantity, item.min_stock)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Low Stock Alerts */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alertas de Estoque Baixo</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Cor/Tamanho</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Mín. Estoque</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allInventory
                      ?.filter(item => {
                        const minStock = item.min_stock || 5;
                        return (item.quantity || 0) <= minStock;
                      })
                      ?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge variant={item.inventory_type === 'raw_material' ? 'outline' : 'default'}>
                              {item.inventory_type === 'raw_material' ? 'Matéria-Prima' : 'Produto Acabado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{(item.products as any)?.name || 'Produto não encontrado'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{item.color}</span>
                              <Badge variant="outline" className="text-xs">{item.size}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.min_stock || 5}</TableCell>
                          <TableCell>{getStatusBadge(item.quantity, item.min_stock)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Estoque;

