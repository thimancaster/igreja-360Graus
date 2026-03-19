import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { invalidateAllTransactionQueries } from "@/lib/queryKeys";

/**
 * Hook que atualiza automaticamente o status das transações vencidas
 * ao carregar o Dashboard, via edge function (service_role).
 */
export function useAutoUpdateOverdue() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!profile?.church_id || hasRun.current) return;

    const updateOverdueStatus = async () => {
      try {
        console.log("[useAutoUpdateOverdue] Atualizando transações vencidas via edge function...");
        
        const { data, error } = await supabase.functions.invoke('update-overdue', {
          body: { church_id: profile.church_id },
        });
        
        if (error) {
          console.error("[useAutoUpdateOverdue] Erro ao atualizar:", error);
          return;
        }
        
        if (data?.updated_count && data.updated_count > 0) {
          console.log(`[useAutoUpdateOverdue] ${data.updated_count} transações atualizadas para "Vencido"`);
          invalidateAllTransactionQueries(queryClient);
        }
        
        hasRun.current = true;
      } catch (err) {
        console.error("[useAutoUpdateOverdue] Erro inesperado:", err);
      }
    };

    updateOverdueStatus();
  }, [profile?.church_id, queryClient]);
}
