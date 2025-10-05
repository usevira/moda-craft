import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RegisterSaleModal } from "./RegisterSaleModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "lucide-react";

interface MyConsignmentsProps {
  consignments: any[];
  resellerCustomer: any;
}

export function MyConsignments({ consignments, resellerCustomer }: MyConsignmentsProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minhas Consignações</CardTitle>
      </CardHeader>
      <CardContent>
        {consignments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Você não possui consignações no momento
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd. Total</TableHead>
                <TableHead className="text-right">Vendidos</TableHead>
                <TableHead className="text-right">Restantes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Recebimento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consignments.map((consignment) => {
                const items = (consignment.consignment_items || []) as any[];
                return items.map((item: any, idx: number) => (
                  <TableRow key={`${consignment.id}-${idx}`}>
                    <TableCell className="font-medium">{item.product_name || "N/A"}</TableCell>
                    <TableCell className="text-right">{item.quantity || 0}</TableCell>
                    <TableCell className="text-right font-medium text-success">
                      {item.sold || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.remaining || 0}
                    </TableCell>
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
                      {consignment.status === "open" && item.remaining > 0 && (
                        <RegisterSaleModal 
                          consignmentItem={item} 
                          consignmentId={consignment.id}
                          resellerCustomer={resellerCustomer}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
