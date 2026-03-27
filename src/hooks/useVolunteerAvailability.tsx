import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface VolunteerAvailability {
  id: string;
  church_id: string;
  volunteer_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAvailabilityData {
  volunteer_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

export function useVolunteerAvailability(volunteerId?: string) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: availability, isLoading } = useQuery({
    queryKey: ["volunteer-availability", volunteerId],
    queryFn: async () => {
      if (!volunteerId) return [];

      const { data, error } = await supabase
        .from("volunteer_availability")
        .select("*")
        .eq("volunteer_id", volunteerId)
        .gte("end_date", new Date().toISOString().split("T")[0])
        .order("start_date");

      if (error) throw error;
      return data as VolunteerAvailability[];
    },
    enabled: !!volunteerId,
  });

  // Fetch all availability for a ministry (for leaders)
  const useMinistryAvailability = (ministryId?: string) => {
    return useQuery({
      queryKey: ["ministry-availability", ministryId],
      queryFn: async () => {
        if (!ministryId) return [];

        const { data, error } = await supabase
          .from("volunteer_availability")
          .select("*, volunteer:department_volunteers!inner(full_name, ministry_id)")
          .eq("volunteer.ministry_id", ministryId)
          .gte("end_date", new Date().toISOString().split("T")[0])
          .order("start_date");

        if (error) throw error;
        return data as (VolunteerAvailability & { volunteer: { full_name: string } })[];
      },
      enabled: !!ministryId,
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateAvailabilityData) => {
      if (!profile?.church_id) throw new Error("Igreja não encontrada");

      const { data: result, error } = await supabase
        .from("volunteer_availability")
        .insert({
          church_id: profile.church_id,
          volunteer_id: data.volunteer_id,
          start_date: data.start_date,
          end_date: data.end_date,
          reason: data.reason || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success("Indisponibilidade registrada!");
      queryClient.invalidateQueries({ queryKey: ["volunteer-availability"] });
      queryClient.invalidateQueries({ queryKey: ["ministry-availability"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar indisponibilidade");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (availabilityId: string) => {
      const { error } = await supabase
        .from("volunteer_availability")
        .delete()
        .eq("id", availabilityId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Indisponibilidade removida!");
      queryClient.invalidateQueries({ queryKey: ["volunteer-availability"] });
      queryClient.invalidateQueries({ queryKey: ["ministry-availability"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover indisponibilidade");
    },
  });

  const isAvailableOnDate = (date: string): boolean => {
    if (!availability) return true;
    return !availability.some(
      (a) => date >= a.start_date && date <= a.end_date
    );
  };

  return {
    availability: availability || [],
    isLoading,
    createAvailability: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteAvailability: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isAvailableOnDate,
    useMinistryAvailability,
  };
}
