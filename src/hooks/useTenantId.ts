import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTenantId() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTenantId = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const appMetadata = session.user.app_metadata;
          const tenant = appMetadata?.tenant_id as string;
          setTenantId(tenant || null);
        }
      } catch (error) {
        console.error("Error getting tenant ID:", error);
      } finally {
        setLoading(false);
      }
    };

    getTenantId();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const appMetadata = session.user.app_metadata;
          const tenant = appMetadata?.tenant_id as string;
          setTenantId(tenant || null);
        } else {
          setTenantId(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { tenantId, loading };
}
