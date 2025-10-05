import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MyConsignments } from "@/components/reseller/MyConsignments";
import { 
  Package, 
  TrendingUp, 
  ShoppingCart,
  DollarSign
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthProvider";

const PortalRevendedor = () => {
  const { user } = useAuth();

  // Buscar o customer associado ao usuário logado
  const { data: resellerCustomer } = useQuery({
    queryKey: ["reseller-customer", user?.id],
    queryFn: async () => {
      if (!user?.email) return null;
      
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("contact", user.email)
        .eq("type", "reseller")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.email,
  });

  // Buscar consignações do revendedor
  const { data: consignments } = useQuery({
    queryKey: ["reseller-consignments", resellerCustomer?.id],
    queryFn: async () => {
      if (!resellerCustomer?.id) return [];
      
      const { data, error } = await supabase
        .from("consignments")
        .select(`
          *,
          consignment_items (
            id,
            product_name,
            quantity,
            sold,
            remaining
          )
        `)
        .eq("partner_id", resellerCustomer.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!resellerCustomer?.id,
  });

  // Calcular estatísticas
  const totalItems = consignments?.reduce((sum, c) => {
    return sum + (c.consignment_items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0);
  }, 0) || 0;

  const totalSold = consignments?.reduce((sum, c) => {
    return sum + (c.consignment_items?.reduce((s, i) => s + (i.sold || 0), 0) || 0);
  }, 0) || 0;

  const totalRemaining = consignments?.reduce((sum, c) => {
    return sum + (c.consignment_items?.reduce((s, i) => s + (i.remaining || 0), 0) || 0);
  }, 0) || 0;

  const openConsignments = consignments?.filter(c => c.status === "open").length || 0;

  if (!resellerCustomer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-2">
              Você não está registrado como revendedor
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o administrador para obter acesso
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Portal do Revendedor</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {resellerCustomer.name}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Consignações Ativas</p>
                  <p className="text-2xl font-bold text-warning">{openConsignments}</p>
                </div>
                <Package className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Itens</p>
                  <p className="text-2xl font-bold">{totalItems}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Itens Vendidos</p>
                  <p className="text-2xl font-bold text-success">{totalSold}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Itens Restantes</p>
                  <p className="text-2xl font-bold">{totalRemaining}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consignments List */}
        <MyConsignments 
          consignments={consignments || []} 
          resellerCustomer={resellerCustomer}
        />
      </div>
    </DashboardLayout>
  );
};

export default PortalRevendedor;
