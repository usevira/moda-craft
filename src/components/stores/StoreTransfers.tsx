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
import { CreateTransferModal } from "./CreateTransferModal";

export function StoreTransfers() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: transfers, isLoading } = useQuery({
    queryKey: ["store-transfers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_transfers")
        .select(`
          *,
          from_store:stores!store_transfers_from_store_id_fkey(name, code),
          to_store:stores!store_transfers_to_store_id_fkey(name, code),
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
      if (status === "completed") {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("store_transfers")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-transfers"] });
      toast.success("Status atualizado");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      pending: "secondary",
      in_transit: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    
    const labels: Record<string, string> = {
      pending: "Pendente",
      in_transit: "Em Trânsito",
      completed: "Concluída",
      cancelled: "Cancelada",
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transferências entre Lojas</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transferência
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers?.map((transfer) => (
            <TableRow key={transfer.id}>
              <TableCell>
                {format(new Date(transfer.created_at), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>
                {transfer.from_store ? `${transfer.from_store.name} (${transfer.from_store.code})` : "Estoque Central"}
              </TableCell>
              <TableCell>
                {transfer.to_store.name} ({transfer.to_store.code})
              </TableCell>
              <TableCell>
                {transfer.inventory.color} - {transfer.inventory.size}
              </TableCell>
              <TableCell>{transfer.quantity}</TableCell>
              <TableCell>{getStatusBadge(transfer.status)}</TableCell>
              <TableCell>
                {transfer.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: transfer.id,
                          status: "in_transit",
                        })
                      }
                    >
                      Iniciar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: transfer.id,
                          status: "cancelled",
                        })
                      }
                    >
                      Cancelar
                    </Button>
                  </div>
                )}
                {transfer.status === "in_transit" && (
                  <Button
                    size="sm"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: transfer.id,
                        status: "completed",
                      })
                    }
                  >
                    Concluir
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CreateTransferModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
