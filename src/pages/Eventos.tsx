import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, MapPin, Plus, Package, RotateCcw, ShoppingCart, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AddEventModal } from "@/components/events/AddEventModal";
import { AllocateStockModal } from "@/components/events/AllocateStockModal";
import { ReturnStockModal } from "@/components/events/ReturnStockModal";
import { RegisterEventSaleModal } from "@/components/events/RegisterEventSaleModal";
import { EventProfitDashboard } from "@/components/events/EventProfitDashboard";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  planned: { label: "Planejado", variant: "secondary" },
  active: { label: "Em Andamento", variant: "default" },
  completed: { label: "Concluído", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export default function Eventos() {
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [saleOpen, setSaleOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events_stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events_stock")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allocations } = useQuery({
    queryKey: ["event_stock_allocations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_stock_allocations")
        .select(`
          *,
          inventory:inventory_id (
            id,
            product_id,
            color,
            size,
            product_style
          ),
          event:event_id (
            name
          )
        `);
      if (error) throw error;
      return data;
    },
  });

  const handleAllocate = (event: { id: string; name: string }) => {
    setSelectedEvent(event);
    setAllocateOpen(true);
  };

  const handleReturn = (event: { id: string; name: string }) => {
    setSelectedEvent(event);
    setReturnOpen(true);
  };

  const handleSale = (event: { id: string; name: string }) => {
    setSelectedEvent(event);
    setSaleOpen(true);
  };

  const activeEvents = events?.filter(e => e.status === "active") || [];
  const plannedEvents = events?.filter(e => e.status === "planned") || [];
  const completedEvents = events?.filter(e => e.status === "completed" || e.status === "cancelled") || [];

  const totalAllocated = allocations?.reduce((sum, a) => sum + a.quantity_allocated, 0) || 0;
  const totalSold = allocations?.reduce((sum, a) => sum + a.quantity_sold, 0) || 0;
  const totalReturned = allocations?.reduce((sum, a) => sum + a.quantity_returned, 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Eventos</h1>
            <p className="text-muted-foreground">Gerencie eventos, alocação e retorno de estoque</p>
          </div>
          <Button onClick={() => setAddEventOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEvents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peças Alocadas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAllocated}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peças Vendidas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSold}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peças Retornadas</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReturned}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profit" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profit" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Lucro Real
            </TabsTrigger>
            <TabsTrigger value="active">Ativos ({activeEvents.length})</TabsTrigger>
            <TabsTrigger value="planned">Planejados ({plannedEvents.length})</TabsTrigger>
            <TabsTrigger value="completed">Finalizados ({completedEvents.length})</TabsTrigger>
            <TabsTrigger value="allocations">Alocações</TabsTrigger>
          </TabsList>

          <TabsContent value="profit" className="space-y-4">
            <EventProfitDashboard />
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <EventsTable 
              events={activeEvents} 
              onAllocate={handleAllocate}
              onReturn={handleReturn}
              onSale={handleSale}
            />
          </TabsContent>

          <TabsContent value="planned" className="space-y-4">
            <EventsTable 
              events={plannedEvents}
              onAllocate={handleAllocate}
              onReturn={handleReturn}
              onSale={handleSale}
            />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <EventsTable 
              events={completedEvents}
              onAllocate={handleAllocate}
              onReturn={handleReturn}
              onSale={handleSale}
            />
          </TabsContent>

          <TabsContent value="allocations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alocações de Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Cor</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead className="text-right">Alocado</TableHead>
                      <TableHead className="text-right">Vendido</TableHead>
                      <TableHead className="text-right">Retornado</TableHead>
                      <TableHead className="text-right">Pendente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations?.map((allocation) => {
                      const pending = allocation.quantity_allocated - allocation.quantity_sold - allocation.quantity_returned;
                      return (
                        <TableRow key={allocation.id}>
                          <TableCell>{(allocation.event as any)?.name || "-"}</TableCell>
                          <TableCell>{(allocation.inventory as any)?.product_style || "-"}</TableCell>
                          <TableCell>{(allocation.inventory as any)?.color || "-"}</TableCell>
                          <TableCell>{(allocation.inventory as any)?.size || "-"}</TableCell>
                          <TableCell className="text-right">{allocation.quantity_allocated}</TableCell>
                          <TableCell className="text-right">{allocation.quantity_sold}</TableCell>
                          <TableCell className="text-right">{allocation.quantity_returned}</TableCell>
                          <TableCell className="text-right font-medium">{pending}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddEventModal 
        open={addEventOpen} 
        onOpenChange={setAddEventOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["events_stock"] })}
      />
      
      {selectedEvent && (
        <>
          <AllocateStockModal
            open={allocateOpen}
            onOpenChange={setAllocateOpen}
            event={selectedEvent}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["event_stock_allocations"] });
              queryClient.invalidateQueries({ queryKey: ["inventory"] });
            }}
          />
          <ReturnStockModal
            open={returnOpen}
            onOpenChange={setReturnOpen}
            event={selectedEvent}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["event_stock_allocations"] });
              queryClient.invalidateQueries({ queryKey: ["inventory"] });
            }}
          />
          <RegisterEventSaleModal
            open={saleOpen}
            onOpenChange={setSaleOpen}
            event={selectedEvent}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["event_stock_allocations"] });
            }}
          />
        </>
      )}
    </DashboardLayout>
  );
}

interface EventsTableProps {
  events: any[];
  onAllocate: (event: { id: string; name: string }) => void;
  onReturn: (event: { id: string; name: string }) => void;
  onSale: (event: { id: string; name: string }) => void;
}

function EventsTable({ events, onAllocate, onReturn, onSale }: EventsTableProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum evento encontrado
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => {
              const status = statusConfig[event.status] || statusConfig.planned;
              return (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {event.location || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(event.start_date), "dd/MM/yyyy", { locale: ptBR })}
                    {event.end_date && ` - ${format(new Date(event.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onAllocate({ id: event.id, name: event.name })}
                        disabled={event.status === "completed" || event.status === "cancelled"}
                      >
                        <Package className="mr-1 h-3 w-3" />
                        Alocar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onSale({ id: event.id, name: event.name })}
                        disabled={event.status === "completed" || event.status === "cancelled"}
                      >
                        <ShoppingCart className="mr-1 h-3 w-3" />
                        Venda
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onReturn({ id: event.id, name: event.name })}
                        disabled={event.status === "completed" || event.status === "cancelled"}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Retorno
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
