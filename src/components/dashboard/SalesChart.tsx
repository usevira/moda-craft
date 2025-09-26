import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const salesData = [
  { month: "Jan", vendas: 4500, meta: 5000 },
  { month: "Fev", vendas: 5200, meta: 5500 },
  { month: "Mar", vendas: 6800, meta: 6000 },
  { month: "Abr", vendas: 5900, meta: 6500 },
  { month: "Mai", vendas: 7200, meta: 7000 },
  { month: "Jun", vendas: 8100, meta: 7500 },
];

export function SalesChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas vs Meta (6 meses)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-muted-foreground"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
                formatter={(value, name) => [
                  `R$ ${value?.toLocaleString('pt-BR')}`,
                  name === 'vendas' ? 'Vendas' : 'Meta'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="vendas" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="meta" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={{ fill: "hsl(var(--muted-foreground))", strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}