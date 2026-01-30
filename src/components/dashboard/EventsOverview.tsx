import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, MapPin, Target, TrendingUp, AlertTriangle, CheckCircle2, PartyPopper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface EventWithMetrics {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  location: string | null;
  status: string;
  sales_goal: number | null;
  totalSales: number;
  totalAllocated: number;
  totalSold: number;
  totalReturned: number;
  totalDivergence: number;
  hasDivergence: boolean;
  goalProgress: number;
  goalReached: boolean;
}

export function EventsOverview() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["dashboard-events-overview"],
    queryFn: async () => {
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events_stock")
        .select("*")
        .order("start_date", { ascending: false })
        .limit(6);

      if (eventsError) throw eventsError;

      // Fetch allocations for these events
      const eventIds = eventsData?.map(e => e.id) || [];
      
      const { data: allocations } = await supabase
        .from("event_stock_allocations")
        .select("*")
        .in("event_id", eventIds);

      // Fetch sales for these events
      const { data: sales } = await supabase
        .from("sales")
        .select("id, total, notes")
        .eq("channel", "event");

      // Calculate metrics for each event
      const eventsWithMetrics: EventWithMetrics[] = eventsData?.map(event => {
        const eventAllocations = allocations?.filter(a => a.event_id === event.id) || [];
        
        const totalAllocated = eventAllocations.reduce((sum, a) => sum + (a.quantity_allocated || 0), 0);
        const totalSold = eventAllocations.reduce((sum, a) => sum + (a.quantity_sold || 0), 0);
        const totalReturned = eventAllocations.reduce((sum, a) => sum + (a.quantity_returned || 0), 0);
        const totalDivergence = eventAllocations.reduce((sum, a) => sum + Math.abs(a.divergence || 0), 0);
        const hasDivergence = eventAllocations.some(a => (a.divergence || 0) !== 0);

        // Estimate sales total (simplified - in production you'd link sales to events)
        const eventSales = sales?.filter(s => s.notes?.toLowerCase().includes(event.name.toLowerCase())) || [];
        const totalSales = eventSales.reduce((sum, s) => sum + (s.total || 0), 0);

        const salesGoal = event.sales_goal || 0;
        const goalProgress = salesGoal > 0 ? Math.min((totalSales / salesGoal) * 100, 100) : 0;
        const goalReached = salesGoal > 0 && totalSales >= salesGoal;

        return {
          id: event.id,
          name: event.name,
          start_date: event.start_date,
          end_date: event.end_date,
          location: event.location,
          status: event.status,
          sales_goal: event.sales_goal,
          totalSales,
          totalAllocated,
          totalSold,
          totalReturned,
          totalDivergence,
          hasDivergence,
          goalProgress,
          goalReached
        };
      }) || [];

      return eventsWithMetrics;
    },
  });

  const statusColors: Record<string, string> = {
    planned: "bg-muted text-muted-foreground",
    active: "bg-primary/10 text-primary",
    completed: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive"
  };

  const statusLabels: Record<string, string> = {
    planned: "Planejado",
    active: "Em Andamento",
    completed: "Concluído",
    cancelled: "Cancelado"
  };

  // Summary stats
  const totalDivergences = events?.filter(e => e.hasDivergence).length || 0;
  const goalsReached = events?.filter(e => e.goalReached).length || 0;
  const activeEvents = events?.filter(e => e.status === "active").length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Visão Geral de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Visão Geral de Eventos
          </CardTitle>
          <div className="flex gap-2">
            {totalDivergences > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {totalDivergences} divergência{totalDivergences > 1 ? "s" : ""}
              </Badge>
            )}
            {goalsReached > 0 && (
              <Badge className="bg-success/10 text-success gap-1">
                <Target className="w-3 h-3" />
                {goalsReached} meta{goalsReached > 1 ? "s" : ""} atingida{goalsReached > 1 ? "s" : ""}
              </Badge>
            )}
            {activeEvents > 0 && (
              <Badge className="bg-primary/10 text-primary gap-1">
                <TrendingUp className="w-3 h-3" />
                {activeEvents} ativo{activeEvents > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  event.hasDivergence && "border-destructive/50 bg-destructive/5",
                  event.goalReached && !event.hasDivergence && "border-success/50 bg-success/5"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{event.name}</h4>
                      <Badge className={statusColors[event.status]}>
                        {statusLabels[event.status]}
                      </Badge>
                      {event.goalReached && (
                        <Badge className="bg-success text-success-foreground gap-1">
                          <PartyPopper className="w-3 h-3" />
                          Meta Atingida!
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {format(new Date(event.start_date), "dd/MM/yyyy", { locale: ptBR })}
                        {event.end_date && ` - ${format(new Date(event.end_date), "dd/MM/yyyy", { locale: ptBR })}`}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {event.hasDivergence && (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {event.totalDivergence} un. divergência
                      </span>
                    </div>
                  )}
                </div>

                {/* Sales Goal Progress */}
                {(event.sales_goal || 0) > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Target className="w-3 h-3" />
                        Meta de Vendas
                      </span>
                      <span className={cn(
                        "font-medium",
                        event.goalReached ? "text-success" : "text-foreground"
                      )}>
                        R$ {event.totalSales.toFixed(2)} / R$ {(event.sales_goal || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={event.goalProgress} 
                        className={cn(
                          "h-2",
                          event.goalReached && "[&>div]:bg-success"
                        )}
                      />
                      {event.goalProgress >= 80 && event.goalProgress < 100 && (
                        <span className="absolute right-0 -top-5 text-xs text-warning font-medium">
                          Quase lá! {event.goalProgress.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stock Metrics */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold">{event.totalAllocated}</p>
                    <p className="text-xs text-muted-foreground">Alocados</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold text-success">{event.totalSold}</p>
                    <p className="text-xs text-muted-foreground">Vendidos</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <p className="text-lg font-bold">{event.totalReturned}</p>
                    <p className="text-xs text-muted-foreground">Devolvidos</p>
                  </div>
                  <div className={cn(
                    "p-2 rounded",
                    event.totalDivergence > 0 ? "bg-destructive/10" : "bg-success/10"
                  )}>
                    <p className={cn(
                      "text-lg font-bold",
                      event.totalDivergence > 0 ? "text-destructive" : "text-success"
                    )}>
                      {event.totalDivergence > 0 ? `-${event.totalDivergence}` : <CheckCircle2 className="w-5 h-5 mx-auto" />}
                    </p>
                    <p className="text-xs text-muted-foreground">Divergência</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum evento encontrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
