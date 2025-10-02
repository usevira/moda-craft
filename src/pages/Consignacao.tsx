import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SendConsignmentModal } from "@/components/consignment/SendConsignmentModal";
import { SettleConsignmentModal } from "@/components/consignment/SettleConsignmentModal";
import { 
  Package, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  User,
  Printer
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Consignacao = () => {
  const [selectedPartner, setSelectedPartner] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: consignments, isLoading } = useQuery({
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

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("type", "reseller")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-warning/20 text-warning">Em Consignação</Badge>;
      case "settled":
        return <Badge className="bg-success/20 text-success">Acertado</Badge>;
      case "partial":
        return <Badge className="bg-primary/20 text-primary">Parcial</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const filteredConsignments = consignments?.filter(c => {
    if (selectedPartner !== "all" && c.partner_id !== selectedPartner) return false;
    if (dateFrom && new Date(c.created_at || "") < new Date(dateFrom)) return false;
    if (dateTo && new Date(c.created_at || "") > new Date(dateTo)) return false;
    return true;
  });

  const totalConsignments = filteredConsignments?.length || 0;
  const openConsignments = filteredConsignments?.filter(c => c.status === "open").length || 0;
  const totalItems = filteredConsignments?.reduce((sum, c) => {
    const items = c.items as any[];
    return sum + (Array.isArray(items) ? items.length : 0);
  }, 0) || 0;

  const getPartnerName = (partnerId: string | null) => {
    if (!partnerId) return "N/A";
    const customer = customers?.find(c => c.id === partnerId);
    return customer?.name || "N/A";
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
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
            <h1 className="text-3xl font-bold">Gestão de Consignação</h1>
            <p className="text-muted-foreground">
              Controle de produtos enviados para revendedores
            </p>
          </div>
          <SendConsignmentModal />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Envios</p>
                  <p className="text-2xl font-bold">{totalConsignments}</p>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Consignação</p>
                  <p className="text-2xl font-bold text-warning">{openConsignments}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Itens</p>
                  <p className="text-2xl font-bold text-success">{totalItems}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Consulta de Estoque Consignado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Filtrar por Revendedor:</label>
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os Revendedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Revendedores</SelectItem>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Início:</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Fim:</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              <div className="space-y-2 flex items-end">
                <Button onClick={handlePrint} variant="outline" className="w-full">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Relatório
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Revendedor</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd. Restante</TableHead>
                  <TableHead className="text-right">Qtd. Enviada</TableHead>
                  <TableHead className="text-right">Qtd. Vendida</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsignments?.map((consignment) => {
                  const items = (consignment.items || []) as any[];
                  return items.map((item: any, idx: number) => (
                    <TableRow key={`${consignment.id}-${idx}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {getPartnerName(consignment.partner_id)}
                        </div>
                      </TableCell>
                      <TableCell>{item.product || "N/A"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.remaining || 0}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity || 0}</TableCell>
                      <TableCell className="text-right">{item.sold || 0}</TableCell>
                      <TableCell>{getStatusBadge(consignment.status || "open")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {consignment.created_at
                            ? new Date(consignment.created_at).toLocaleDateString("pt-BR")
                            : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {idx === 0 && consignment.status === "open" && (
                          <SettleConsignmentModal consignment={consignment} />
                        )}
                      </TableCell>
                    </TableRow>
                  ));
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Consignacao;
