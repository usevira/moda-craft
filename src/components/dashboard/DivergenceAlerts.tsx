import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Package, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface DivergenceAlert {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  productInfo: string;
  quantityAllocated: number;
  quantitySold: number;
  quantityReturned: number;
  countedReturn: number | null;
  divergence: number;
  divergenceNotes: string | null;
}

export function DivergenceAlerts() {
  const navigate = useNavigate();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["dashboard-divergence-alerts"],
    queryFn: async () => {
      // Fetch allocations with divergences
      const { data: allocations, error } = await supabase
        .from("event_stock_allocations")
        .select(`
          id,
          event_id,
          inventory_id,
          quantity_allocated,
          quantity_sold,
          quantity_returned,
          counted_return,
          divergence,
          divergence_notes
        `)
        .neq("divergence", 0)
        .order("allocated_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get event details
      const eventIds = [...new Set(allocations?.map(a => a.event_id) || [])];
      const { data: events } = await supabase
        .from("events_stock")
        .select("id, name, start_date")
        .in("id", eventIds);

      // Get inventory details
      const inventoryIds = [...new Set(allocations?.map(a => a.inventory_id) || [])];
      const { data: inventory } = await supabase
        .from("inventory")
        .select("id, product_id, color, size, product_style")
        .in("id", inventoryIds);

      // Get product names
      const productIds = [...new Set(inventory?.map(i => i.product_id).filter(Boolean) || [])];
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

      const divergenceAlerts: DivergenceAlert[] = allocations?.map(alloc => {
        const event = events?.find(e => e.id === alloc.event_id);
        const inv = inventory?.find(i => i.id === alloc.inventory_id);
        const product = products?.find(p => p.id === inv?.product_id);

        const productInfo = product 
          ? `${product.name} - ${inv?.color || ''} ${inv?.size || ''} (${inv?.product_style || ''})`
          : `Produto ID: ${inv?.product_id || 'N/A'}`;

        return {
          id: alloc.id,
          eventId: alloc.event_id,
          eventName: event?.name || 'Evento não encontrado',
          eventDate: event?.start_date || '',
          productInfo,
          quantityAllocated: alloc.quantity_allocated,
          quantitySold: alloc.quantity_sold,
          quantityReturned: alloc.quantity_returned,
          countedReturn: alloc.counted_return,
          divergence: alloc.divergence || 0,
          divergenceNotes: alloc.divergence_notes
        };
      }) || [];

      return divergenceAlerts;
    },
  });

  const totalDivergence = alerts?.reduce((sum, a) => sum + Math.abs(a.divergence), 0) || 0;

  if (isLoading) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Divergência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-success">
            <Package className="w-5 h-5" />
            Sem Divergências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Todos os retornos de eventos estão conferidos e sem divergências.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Divergência
          </CardTitle>
          <Badge variant="destructive">
            {totalDivergence} un. total
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className="p-3 rounded-lg border border-destructive/30 bg-destructive/5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{alert.eventName}</span>
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {alert.eventDate && format(new Date(alert.eventDate), "dd/MM/yy", { locale: ptBR })}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {alert.productInfo}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span>Alocado: <strong>{alert.quantityAllocated}</strong></span>
                  <span>Vendido: <strong>{alert.quantitySold}</strong></span>
                  <span>Contado: <strong>{alert.countedReturn ?? '-'}</strong></span>
                  <span className="text-destructive font-bold">
                    Divergência: {alert.divergence > 0 ? '+' : ''}{alert.divergence}
                  </span>
                </div>
                {alert.divergenceNotes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Obs: {alert.divergenceNotes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {alerts.length > 5 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate("/eventos")}
          >
            Ver todos ({alerts.length} divergências)
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
