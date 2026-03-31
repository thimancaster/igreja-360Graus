import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";

export interface VolunteerSchedule {
  id: string;
  church_id: string;
  ministry_id: string;
  volunteer_id: string | null;
  volunteer_name?: string;
  schedule_date: string;
  shift_start: string;
  shift_end: string;
  schedule_type: 'primary' | 'backup';
  confirmed: boolean;
  confirmed_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  accept_until: string | null;
  ministry_name?: string;
}

export interface CreateScheduleData {
  ministry_id: string;
  volunteer_id?: string | null;
  schedule_date: string;
  shift_start: string;
  shift_end: string;
  schedule_type?: 'primary' | 'backup';
  notes?: string;
  accept_until?: string | null;
}

export function useVolunteerSchedules(ministryId?: string, month?: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const currentMonth = month || new Date();
  const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  // Fetch schedules for a ministry in a given month
  const { data: schedules, isLoading, refetch } = useQuery({
    queryKey: ["volunteer-schedules", ministryId, startDate, endDate],
    queryFn: async () => {
      if (!ministryId) return [];

      const { data, error } = await supabase
        .from("volunteer_schedules")
        .select(`
          *,
          volunteer:department_volunteers(full_name)
        `)
        .eq("ministry_id", ministryId)
        .gte("schedule_date", startDate)
        .lte("schedule_date", endDate)
        .order("schedule_date")
        .order("shift_start");

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        volunteer_name: item.volunteer?.full_name,
      })) as VolunteerSchedule[];
    },
    enabled: !!ministryId,
  });

  // Fetch my schedules AND open schedules
  const { data: volunteerDataObj, isLoading: mySchedulesLoading } = useQuery({
    queryKey: ["my-volunteer-data", user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return { mySchedules: [], openSchedules: [] };

      const { data: volunteerData } = await supabase
        .from("department_volunteers")
        .select("id, ministry_id, ministries(name)")
        .eq("profile_id", user.id)
        .eq("status", "active");

      if (!volunteerData || volunteerData.length === 0) {
        return { mySchedules: [], openSchedules: [], volunteerData: [] };
      }

      const volunteerIds = volunteerData.map(v => v.id);
      const ministryIds = volunteerData.map(v => v.ministry_id);

      // fetch assigned schedules
      const { data: assignedData, error: assignedError } = await supabase
        .from("volunteer_schedules")
        .select("*")
        .in("volunteer_id", volunteerIds)
        .gte("schedule_date", startDate)
        .lte("schedule_date", endDate)
        .order("schedule_date")
        .order("shift_start");
        
      if (assignedError) throw assignedError;

      // fetch open schedules
      const { data: openData, error: openError } = await supabase
        .from("volunteer_schedules")
        .select(`*, ministries!inner(name)`)
        .is("volunteer_id", null)
        .in("ministry_id", ministryIds)
        .gte("schedule_date", startDate)
        .lte("schedule_date", endDate)
        .order("schedule_date")
        .order("shift_start");

      if (openError) throw openError;
      
      const now = new Date().toISOString();
      const validOpenData = (openData || []).filter((s: any) => !s.accept_until || s.accept_until > now);

      const mySchedules = (assignedData || []).map((schedule: any) => {
        const volunteer = volunteerData.find(v => v.id === schedule.volunteer_id);
        return {
          ...schedule,
          ministry_name: (volunteer?.ministries as any)?.name || "Ministério",
        };
      }) as VolunteerSchedule[];

      const openSchedules = validOpenData.map((schedule: any) => {
        return {
          ...schedule,
          ministry_name: schedule.ministries?.name || "Ministério",
        };
      }) as VolunteerSchedule[];

      return { mySchedules, openSchedules, volunteerData };
    },
    enabled: !!user?.id,
  });

  // Create schedule
  const createMutation = useMutation({
    mutationFn: async (data: CreateScheduleData) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.church_id) throw new Error("Igreja não encontrada");

      const { data: schedule, error } = await supabase
        .from("volunteer_schedules")
        .insert({
          church_id: profile.church_id,
          ministry_id: data.ministry_id,
          volunteer_id: data.volunteer_id || null,
          schedule_date: data.schedule_date,
          shift_start: data.shift_start,
          shift_end: data.shift_end,
          schedule_type: data.schedule_type || "primary",
          notes: data.notes || null,
          accept_until: data.accept_until || null,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return schedule;
    },
    onSuccess: () => {
      toast.success("Escala criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-data"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar escala");
    },
  });

  // Update schedule
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VolunteerSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from("volunteer_schedules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Escala atualizada!");
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-data"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar escala");
    },
  });

  // Delete schedule
  const deleteMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from("volunteer_schedules")
        .delete()
        .eq("id", scheduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Escala removida");
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-data"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover escala");
    },
  });

  // Confirm schedule
  const confirmMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const { error } = await supabase
        .from("volunteer_schedules")
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", scheduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Presença confirmada!");
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-data"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao confirmar presença");
    },
  });

  // Claim open schedule
  const claimMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      const scheduleToClaim = volunteerDataObj?.openSchedules?.find((s) => s.id === scheduleId);
      if (!scheduleToClaim) throw new Error("Vaga não encontrada.");

      const activeVol = volunteerDataObj?.volunteerData?.find((v) => v.ministry_id === scheduleToClaim.ministry_id);
      if (!activeVol) throw new Error("Você não é voluntário ativo neste ministério.");

      const { error } = await supabase
        .from("volunteer_schedules")
        .update({
          volunteer_id: activeVol.id,
          confirmed: true,
          confirmed_at: new Date().toISOString(),
          accept_until: null, 
        })
        .eq("id", scheduleId)
        .is("volunteer_id", null);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vaga preenchida! Escala adicionada à sua agenda.");
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-data"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao assumir vaga");
    },
  });

  const schedulesByDate = (schedules || []).reduce((acc, schedule) => {
    const date = schedule.schedule_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(schedule);
    return acc;
  }, {} as Record<string, VolunteerSchedule[]>);

  const hasConflict = (volunteerId: string, date: string, start: string, end: string, excludeId?: string) => {
    return (schedules || []).some(s => {
      if (excludeId && s.id === excludeId) return false;
      if (s.volunteer_id !== volunteerId || s.schedule_date !== date) return false;
      
      const existingStart = s.shift_start;
      const existingEnd = s.shift_end;
      return (start < existingEnd && end > existingStart);
    });
  };

  return {
    schedules: schedules || [],
    schedulesByDate,
    mySchedules: volunteerDataObj?.mySchedules || [],
    openSchedules: volunteerDataObj?.openSchedules || [],
    volunteerData: volunteerDataObj?.volunteerData || [],
    isLoading,
    mySchedulesLoading,
    refetch,
    createSchedule: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateSchedule: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteSchedule: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    confirmSchedule: confirmMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    claimSchedule: claimMutation.mutateAsync,
    isClaiming: claimMutation.isPending,
    hasConflict,
  };
}
