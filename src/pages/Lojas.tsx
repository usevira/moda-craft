import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreManagement } from "@/components/stores/StoreManagement";
import { StoreTransfers } from "@/components/stores/StoreTransfers";
import { StockReservations } from "@/components/inventory/StockReservations";

export default function Lojas() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Lojas</h1>
          <p className="text-muted-foreground">
            Gerencie suas lojas, transferências e reservas de estoque
          </p>
        </div>

        <Tabs defaultValue="stores" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stores">Lojas</TabsTrigger>
            <TabsTrigger value="transfers">Transferências</TabsTrigger>
            <TabsTrigger value="reservations">Reservas</TabsTrigger>
          </TabsList>

          <TabsContent value="stores">
            <StoreManagement />
          </TabsContent>

          <TabsContent value="transfers">
            <StoreTransfers />
          </TabsContent>

          <TabsContent value="reservations">
            <StockReservations />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
