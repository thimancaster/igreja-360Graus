import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ScheduleSwap {
  id: string;
  church_id: string;
  original_schedule_id: string;
  requester_id: string;
  target_volunteer_id: string | null;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  reason: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  requester_name?: string;
  target_name?: string;
  schedule_date?: string;
  shift_start?: string;
  shift_end?: string;
}

export function useVolunteerScheduleSwaps(volunteerId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch swaps where I am the requester or target
  const { data: swaps, isLoading } = useQuery({
    queryKey: ["volunteer-swaps", volunteerId],
    queryFn: async () => {
      if (!volunteerId) return [];

      const { data, error } = await supabase
        .from("volunteer_schedule_swaps")
        .select(`
          *,
          requester:department_volunteers!volunteer_schedule_swaps_requester_id_fkey(full_name),
          target:department_volunteers!volunteer_schedule_swaps_target_volunteer_id_fkey(full_name),
          schedule:volunteer_schedules!volunteer_schedule_swaps_original_schedule_id_fkey(schedule_date, shift_start, shift_end)
        `)
        .or(`requester_id.eq.${volunteerId},target_volunteer_id.eq.${volunteerId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        requester_name: item.requester?.full_name,
        target_name: item.target?.full_name,
        schedule_date: item.schedule?.schedule_date,
        shift_start: item.schedule?.shift_start,
        shift_end: item.schedule?.shift_end,
      })) as ScheduleSwap[];
    },
    enabled: !!volunteerId,
  });

  const createSwapMutation = useMutation({
    mutationFn: async (data: {
      original_schedule_id: string;
      requester_id: string;
      target_volunteer_id?: string;
      reason?: string;
    }) => {
      if (!profile?.church_id) throw new Error("Igreja não encontrada");

      const { data: result, error } = await supabase
        .from("volunteer_schedule_swaps")
        .insert({
          church_id: profile.church_id,
          original_schedule_id: data.original_schedule_id,
          requester_id: data.requester_id,
          target_volunteer_id: data.target_volunteer_id || null,
          reason: data.reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("Solicitação de troca enviada!");
      queryClient.invalidateQueries({ queryKey: ["volunteer-swaps"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao solicitar troca");
    },
  });

  const respondSwapMutation = useMutation({
    mutationFn: async ({
      swapId,
      status,
    }: {
      swapId: string;
      status: "accepted" | "rejected";
    }) => {
      const { error } = await supabase
        .from("volunteer_schedule_swaps")
        .update({
          status,
          responded_at: new Date().toISOString(),
        })
        .eq("id", swapId);

      if (error) throw error;

      // If accepted, swap the volunteer on the schedule
      if (status === "accepted") {
        const swap = swaps?.find((s) => s.id === swapId);
        if (swap && swap.target_volunteer_id) {
          const { error: updateError } = await supabase
            .from("volunteer_schedules")
            .update({ volunteer_id: swap.target_volunteer_id })
            .eq("id", swap.original_schedule_id);

          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: (_, variables) => {
      const msg = variables.status === "accepted" ? "Troca aceita!" : "Troca rejeitada";
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["volunteer-swaps"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-schedules"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao responder troca");
    },
  });

  const cancelSwapMutation = useMutation({
    mutationFn: async (swapId: string) => {
      const { error } = await supabase
        .from("volunteer_schedule_swaps")
        .update({ status: "cancelled" as any })
        .eq("id", swapId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação cancelada");
      queryClient.invalidateQueries({ queryKey: ["volunteer-swaps"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cancelar");
    },
  });

  const pendingSwaps = (swaps || []).filter((s) => s.status === "pending");
  const myRequests = (swaps || []).filter((s) => s.requester_id === volunteerId);
  const incomingRequests = (swaps || []).filter(
    (s) => s.target_volunteer_id === volunteerId && s.status === "pending"
  );

  return {
    swaps: swaps || [],
    pendingSwaps,
    myRequests,
    incomingRequests,
    isLoading,
    createSwap: createSwapMutation.mutateAsync,
    isCreatingSwap: createSwapMutation.isPending,
    respondSwap: respondSwapMutation.mutateAsync,
    isResponding: respondSwapMutation.isPending,
    cancelSwap: cancelSwapMutation.mutateAsync,
    isCancelling: cancelSwapMutation.isPending,
  };
}
