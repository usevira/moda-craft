import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddInventoryModal } from "@/components/inventory/AddInventoryModal";
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

const mockInventory = [
  {
    id: "1",
    sku: "CAM-001-P-PR",
    produto: "Camiseta Básica",
    cor: "Preta",
    tamanho: "P",
    quantidade: 45,
    reservado: 5,
    disponivel: 40,
    custoUnitario: 12.50,
    precoVenda: 35.00,
    status: "normal"
  },
  {
    id: "2", 
    sku: "CAM-001-M-BR",
    produto: "Camiseta Básica",
    cor: "Branca",
    tamanho: "M",
    quantidade: 8,
    reservado: 2,
    disponivel: 6,
    custoUnitario: 12.50,
    precoVenda: 35.00,
    status: "baixo"
  },
  {
    id: "3",
    sku: "VES-002-G-AZ",
    produto: "Vestido Verão",
    cor: "Azul",
    tamanho: "G",
    quantidade: 0,
    reservado: 0,
    disponivel: 0,
    custoUnitario: 25.00,
    precoVenda: 89.00,
    status: "zerado"
  },
  {
    id: "4",
    sku: "CAL-003-M-JE",
    produto: "Calça Jeans",
    cor: "Jeans",
    tamanho: "M",
    quantidade: 23,
    reservado: 1,
    disponivel: 22,
    custoUnitario: 45.00,
    precoVenda: 120.00,
    status: "normal"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "normal":
      return <Badge className="bg-success/20 text-success">Normal</Badge>;
    case "baixo":
      return <Badge className="bg-warning/20 text-warning">Baixo</Badge>;
    case "zerado":
      return <Badge className="bg-destructive/20 text-destructive">Zerado</Badge>;
    default:
      return <Badge variant="outline">-</Badge>;
  }
};

const Estoque = () => {
  const totalItens = mockInventory.reduce((acc, item) => acc + item.quantidade, 0);
  const itensBaixo = mockInventory.filter(item => item.status === "baixo").length;
  const itensZerados = mockInventory.filter(item => item.status === "zerado").length;
  const valorTotal = mockInventory.reduce((acc, item) => acc + (item.quantidade * item.custoUnitario), 0);

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
                  <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
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
                  <TableHead className="text-right">Disponível</TableHead>
                  <TableHead className="text-right">Custo Unit.</TableHead>
                  <TableHead className="text-right">Preço Venda</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.produto}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.cor}</span>
                        <Badge variant="outline" className="text-xs">{item.tamanho}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <span className="font-medium">{item.quantidade}</span>
                        {item.reservado > 0 && (
                          <div className="text-xs text-muted-foreground">
                            ({item.reservado} reservado)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{item.disponivel}</TableCell>
                    <TableCell className="text-right">R$ {item.custoUnitario.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">R$ {item.precoVenda.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
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