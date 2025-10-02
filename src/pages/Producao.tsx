import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AddBatchModal } from "@/components/production/AddBatchModal";
import { 
  Plus, 
  Factory,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  Printer,
  ClipboardList
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

const Producao = () => {
  const { data: batches, isLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batches")
        .select(`
          *,
          batches_materials (
            qty_used,
            materials (name, unit)
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/20 text-success">Concluído</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/20 text-primary">Em Andamento</Badge>;
      case "planned":
        return <Badge className="bg-warning/20 text-warning">Planejado</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case "completed": return 100;
      case "in_progress": return 65;
      case "planned": return 0;
      default: return 0;
    }
  };

  // Calcula materiais necessários para lotes pendentes
  const { data: pendingBatchesMaterials } = useQuery({
    queryKey: ["pendingBatchesMaterials", batches],
    queryFn: async () => {
      const pendingBatches = batches?.filter(
        b => b.status === "planned" || b.status === "in_progress"
      );
      
      if (!pendingBatches || pendingBatches.length === 0) return [];

      const materialMap = new Map<string, { 
        material: string; 
        totalNeeded: number; 
        batches: string[];
      }>();

      for (const batch of pendingBatches) {
        if (batch.batches_materials && Array.isArray(batch.batches_materials)) {
          batch.batches_materials.forEach((bm: any) => {
            const materialName = bm.materials?.name || "Material desconhecido";
            const existing = materialMap.get(materialName);
            
            if (existing) {
              existing.totalNeeded += bm.qty_used || 0;
              existing.batches.push(batch.product_name);
            } else {
              materialMap.set(materialName, {
                material: materialName,
                totalNeeded: bm.qty_used || 0,
                batches: [batch.product_name],
              });
            }
          });
        }
      }

      return Array.from(materialMap.values());
    },
    enabled: !!batches,
  });

  const totalBatches = batches?.length || 0;
  const completedBatches = batches?.filter(b => b.status === "completed").length || 0;
  const inProgressBatches = batches?.filter(b => b.status === "in_progress").length || 0;
  const totalCost = batches?.reduce((sum, batch) => sum + (batch.total_cost || 0), 0) || 0;

  const handlePrintPending = () => {
    const pendingBatches = batches?.filter(
      b => b.status === "planned" || b.status === "in_progress"
    );
    
    const printWindow = window.open("", "", "height=600,width=800");
    if (!printWindow) return;

    printWindow.document.write("<html><head><title>Lotes Pendentes</title>");
    printWindow.document.write("<style>");
    printWindow.document.write("body { font-family: Arial, sans-serif; padding: 20px; }");
    printWindow.document.write("h1 { color: #333; }");
    printWindow.document.write("table { width: 100%; border-collapse: collapse; margin-top: 20px; }");
    printWindow.document.write("th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }");
    printWindow.document.write("th { background-color: #f2f2f2; }");
    printWindow.document.write("</style></head><body>");
    printWindow.document.write("<h1>Lotes Pendentes - Ordem de Produção</h1>");
    printWindow.document.write("<table>");
    printWindow.document.write("<tr><th>Lote</th><th>Produto</th><th>Quantidade</th><th>Status</th></tr>");
    
    pendingBatches?.forEach(batch => {
      printWindow.document.write("<tr>");
      printWindow.document.write(`<td>#${batch.id.slice(0, 8)}</td>`);
      printWindow.document.write(`<td>${batch.product_name}</td>`);
      printWindow.document.write(`<td>${batch.quantity}</td>`);
      printWindow.document.write(`<td>${batch.status === 'planned' ? 'Planejado' : 'Em Andamento'}</td>`);
      printWindow.document.write("</tr>");
    });
    
    printWindow.document.write("</table></body></html>");
    printWindow.document.close();
    printWindow.print();
  };

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
            <h1 className="text-3xl font-bold">Gestão de Produção</h1>
            <p className="text-muted-foreground">
              Controle de lotes e processos produtivos
            </p>
          </div>
          <AddBatchModal />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Lotes</p>
                  <p className="text-2xl font-bold">{totalBatches}</p>
                </div>
                <Factory className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold text-primary">{inProgressBatches}</p>
                </div>
                <Clock className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-bold text-success">{completedBatches}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Custo Total</p>
                  <p className="text-2xl font-bold">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <Package className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ordem de Separação */}
        {pendingBatchesMaterials && pendingBatchesMaterials.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Ordem de Separação de Peças Lisas (Total de Lotes Pendentes)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peça Lisa (Matéria-Prima)</TableHead>
                    <TableHead className="text-right">Quantidade a Separar</TableHead>
                    <TableHead>Estampa a Produzir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBatchesMaterials.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.material}</TableCell>
                      <TableCell className="text-right font-bold">{item.totalNeeded}</TableCell>
                      <TableCell>{item.batches.join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Production Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fila de Lotes</CardTitle>
              <Button onClick={handlePrintPending} variant="outline" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Todos os Lotes Pendentes
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches?.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono text-sm">#{batch.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{batch.product_name}</TableCell>
                    <TableCell className="text-right">{batch.quantity}</TableCell>
                    <TableCell className="text-right">
                      R$ {(batch.total_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={getStatusProgress(batch.status || 'planned')} className="h-2" />
                        <span className="text-xs text-muted-foreground">
                          {getStatusProgress(batch.status || 'planned')}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(batch.status || 'planned')}</TableCell>
                    <TableCell>
                      {batch.created_at ? new Date(batch.created_at).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Materials Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Status de Materiais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materials?.slice(0, 6).map((material) => (
                <div key={material.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{material.name}</h4>
                    <Badge variant={material.stock < material.min_stock ? "destructive" : "outline"}>
                      {material.stock} {material.unit}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Custo: R$ {(material.unit_cost || 0).toFixed(2)}/{material.unit}
                  </p>
                  {material.stock < material.min_stock && (
                    <div className="flex items-center gap-1 mt-2 text-destructive text-xs">
                      <AlertCircle className="w-3 h-3" />
                      Estoque baixo
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Producao;