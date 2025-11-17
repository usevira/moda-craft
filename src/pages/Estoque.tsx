import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter,
  Package,
  AlertTriangle,
  TrendingDown,
  Shirt,
  Store
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
  const [selectedStore, setSelectedStore] = useState<string>("all");

  // Fetch stores for filter
  const { data: stores } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: rawMaterials, isLoading: loadingRaw } = useQuery({
    queryKey: ["inventory", "raw_material", selectedStore],
    queryFn: async () => {
      // Expire old reservations first
      await supabase.rpc("expire_stock_reservations");

      let query = supabase
        .from("v_inventory_availability")
        .select("*")
        .eq("inventory_type", "raw_material");
      
      if (selectedStore !== "all") {
        query = query.eq("store_id", selectedStore);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const { data: finishedProducts, isLoading: loadingFinished } = useQuery({
    queryKey: ["inventory", "finished_product", selectedStore],
    queryFn: async () => {
      // Expire old reservations first
      await supabase.rpc("expire_stock_reservations");

      let query = supabase
        .from("v_inventory_availability")
        .select("*")
        .eq("inventory_type", "finished_product");
      
      if (selectedStore !== "all") {
        query = query.eq("store_id", selectedStore);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingRaw || loadingFinished;
  const allInventory = [...(rawMaterials || []), ...(finishedProducts || [])];

  const totalItens = allInventory?.reduce((acc, item) => acc + (item.available_quantity || 0), 0) || 0;
  const totalReservado = allInventory?.reduce((acc, item) => acc + (item.reserved_quantity || 0), 0) || 0;
  const itensBaixo = allInventory?.filter(item => {
    const minStock = item.min_stock || 5;
    return (item.available_quantity || 0) > 0 && (item.available_quantity || 0) <= minStock;
  }).length || 0;
  const itensZerados = allInventory?.filter(item => (item.available_quantity || 0) === 0).length || 0;

  const totalRawMaterials = rawMaterials?.reduce((acc, item) => acc + (item.available_quantity || 0), 0) || 0;
  const totalFinished = finishedProducts?.reduce((acc, item) => acc + (item.available_quantity || 0), 0) || 0;

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
                  <p className="text-sm font-medium text-muted-foreground">Disponível</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Reservado</p>
                  <p className="text-2xl font-bold text-warning">{totalReservado}</p>
                </div>
                <Package className="w-8 h-8 text-warning" />
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
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                      <SelectTrigger className="w-48">
                        <Store className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filtrar por loja" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as lojas</SelectItem>
                        {stores?.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Buscar produtos..." className="pl-10 w-64" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Estilo</TableHead>
                      <TableHead>Cor/Tamanho</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Disponível</TableHead>
                      <TableHead className="text-right">Reservado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
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
                        <TableCell className="font-medium">{item.color}</TableCell>
                        <TableCell>
                          {item.product_style && (
                            <div className="flex items-center gap-1">
                              <Shirt className="w-4 h-4" />
                              <span>{item.product_style}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{item.size}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.store_name ? (
                            <div className="flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              <span className="text-sm">{item.store_name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Central</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.location || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{item.available_quantity}</TableCell>
                        <TableCell className="text-right text-warning">{item.reserved_quantity}</TableCell>
                        <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                        <TableCell>{getStatusBadge(item.available_quantity, item.min_stock)}</TableCell>
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
                      <TableHead>Loja</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Disponível</TableHead>
                      <TableHead className="text-right">Reservado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
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
                        <TableCell>
                          {item.store_name ? (
                            <div className="flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              <span className="text-sm">{item.store_name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Central</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.location || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{item.available_quantity}</TableCell>
                        <TableCell className="text-right text-warning">{item.reserved_quantity}</TableCell>
                        <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                        <TableCell>{getStatusBadge(item.available_quantity, item.min_stock)}</TableCell>
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
                      <TableHead>Produto</TableHead>
                      <TableHead>Estilo</TableHead>
                      <TableHead>Cor/Tamanho</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead className="text-right">Disponível</TableHead>
                      <TableHead className="text-right">Reservado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
              </TableHeader>
              <TableBody>
                {finishedProducts?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.color}</TableCell>
                        <TableCell>{item.product_style || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{item.size}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.store_name ? (
                            <div className="flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              <span className="text-sm">{item.store_name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Central</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.location || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{item.available_quantity}</TableCell>
                        <TableCell className="text-right text-warning">{item.reserved_quantity}</TableCell>
                        <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                        <TableCell>{getStatusBadge(item.available_quantity, item.min_stock)}</TableCell>
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
                      <TableHead>Loja</TableHead>
                      <TableHead className="text-right">Disponível</TableHead>
                      <TableHead className="text-right">Reservado</TableHead>
                      <TableHead className="text-right">Mín. Estoque</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allInventory
                      ?.filter(item => {
                        const minStock = item.min_stock || 5;
                        return (item.available_quantity || 0) <= minStock;
                      })
                      ?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge variant={item.inventory_type === 'raw_material' ? 'outline' : 'default'}>
                              {item.inventory_type === 'raw_material' ? 'Matéria-Prima' : 'Produto Acabado'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{item.color}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{item.size}</Badge>
                          </TableCell>
                          <TableCell>
                            {item.store_name ? (
                              <div className="flex items-center gap-1">
                                <Store className="w-3 h-3" />
                                <span className="text-sm">{item.store_name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Central</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.available_quantity}</TableCell>
                          <TableCell className="text-right text-warning">{item.reserved_quantity}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{item.min_stock || 5}</TableCell>
                          <TableCell>{getStatusBadge(item.available_quantity, item.min_stock)}</TableCell>
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

