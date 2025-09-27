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

  const totalBatches = batches?.length || 0;
  const completedBatches = batches?.filter(b => b.status === "completed").length || 0;
  const inProgressBatches = batches?.filter(b => b.status === "in_progress").length || 0;
  const totalCost = batches?.reduce((sum, batch) => sum + (batch.total_cost || 0), 0) || 0;

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

        {/* Production Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lotes de Produção</CardTitle>
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