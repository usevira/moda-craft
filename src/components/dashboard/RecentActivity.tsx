import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Activity {
  id: string;
  type: "sale" | "production" | "inventory" | "finance";
  description: string;
  timestamp: Date;
  status: "success" | "pending" | "warning";
  value?: string;
}

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "sale",
    description: "Venda realizada - Cliente Maria Silva",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    status: "success",
    value: "R$ 180,00"
  },
  {
    id: "2", 
    type: "production",
    description: "Lote #001 finalizado - Camisetas Básicas",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: "success",
  },
  {
    id: "3",
    type: "inventory",
    description: "Estoque baixo - Algodão Branco",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    status: "warning",
  },
  {
    id: "4",
    type: "finance",
    description: "Pagamento recebido - Consignação Loja ABC",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    status: "success",
    value: "R$ 750,00"
  },
];

const typeLabels = {
  sale: { label: "Venda", color: "bg-success" },
  production: { label: "Produção", color: "bg-primary" },
  inventory: { label: "Estoque", color: "bg-warning" },
  finance: { label: "Financeiro", color: "bg-accent" }
};

const statusColors = {
  success: "bg-success/20 text-success",
  pending: "bg-warning/20 text-warning", 
  warning: "bg-destructive/20 text-destructive"
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg border">
              <div className={`w-2 h-2 rounded-full ${typeLabels[activity.type].color}`} />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {typeLabels[activity.type].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              </div>

              {activity.value && (
                <div className="text-sm font-medium text-success">
                  {activity.value}
                </div>
              )}
              
              <Badge className={statusColors[activity.status]}>
                {activity.status === "success" ? "✓" : 
                 activity.status === "pending" ? "⏳" : "⚠️"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}