import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { CreateReservationModal } from "./CreateReservationModal";

export function StockReservations() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["stock-reservations"],
    queryFn: async () => {
      // Expire old reservations first
      await supabase.rpc("expire_stock_reservations");

      const { data, error } = await supabase
        .from("stock_reservations")
        .select(`
          *,
          inventory(product_id, color, size)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "fulfilled") {
        updates.fulfilled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("stock_reservations")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-reservations"] });
      toast.success("Status atualizado");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      active: "default",
      fulfilled: "outline",
      expired: "secondary",
      cancelled: "destructive",
    };
    
    const labels: Record<string, string> = {
      active: "Ativa",
      fulfilled: "Cumprida",
      expired: "Expirada",
      cancelled: "Cancelada",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reservas de Estoque</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Reserva
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Reservado em</TableHead>
            <TableHead>Expira em</TableHead>
            <TableHead>Referência</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations?.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell>
                {reservation.inventory.color} - {reservation.inventory.size}
              </TableCell>
              <TableCell>{reservation.quantity}</TableCell>
              <TableCell>
                {format(new Date(reservation.reserved_at), "dd/MM/yyyy HH:mm")}
              </TableCell>
              <TableCell>
                {format(new Date(reservation.expires_at), "dd/MM/yyyy HH:mm")}
              </TableCell>
              <TableCell>
                {reservation.reference_type || "-"}
              </TableCell>
              <TableCell>{getStatusBadge(reservation.status)}</TableCell>
              <TableCell>
                {reservation.status === "active" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: reservation.id,
                          status: "fulfilled",
                        })
                      }
                    >
                      Cumprir
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: reservation.id,
                          status: "cancelled",
                        })
                      }
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CreateReservationModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
