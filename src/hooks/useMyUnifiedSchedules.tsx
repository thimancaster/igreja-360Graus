import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, isAfter, parseISO } from "date-fns";

export interface UnifiedSchedule {
  id: string;
  date: string;
  start: string;
  end: string;
  ministry: string;
  ministryId?: string;
  type: 'primary' | 'backup' | 'staff';
  confirmed: boolean;
  confirmed_at: string | null;
  origin: 'general' | 'infantil';
  notes?: string;
  classroom?: string;
  is_staff?: boolean;
  volunteer_id?: string | null;
  staff_id?: string;
  schedule_date?: string;
  shift_start?: string;
  shift_end?: string;
}

export interface ScheduleStats {
  total: number;
  upcoming: number;
  confirmed: number;
  pending: number;
  infantil: number;
  general: number;
}

export function useMyUnifiedSchedules(month?: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const currentMonth = month || new Date();
  const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");
  const now = new Date();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-unified-schedules", user?.id, startDate, endDate],
    queryFn: async (): Promise<{
      schedules: UnifiedSchedule[];
      stats: ScheduleStats;
    }> => {
      if (!user?.id) {
        return { schedules: [], stats: { total: 0, upcoming: 0, confirmed: 0, pending: 0, infantil: 0, general: 0 } };
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .single();

      const churchId = profile?.church_id;
      const allSchedules: UnifiedSchedule[] = [];
      let infantilCount = 0;
      let generalCount = 0;

      // Fetch volunteer data for ministry association
      const { data: volunteerData } = await supabase
        .from("department_volunteers")
        .select("id, ministry_id, full_name")
        .eq("profile_id", user.id)
        .eq("status", "active");

      const volunteerIds = volunteerData?.map(v => v.id) || [];

      // SOURCE A: Volunteer Schedules (Geral)
      if (volunteerIds.length > 0) {
        const { data: generalSchedules } = await supabase
          .from("volunteer_schedules")
          .select(`
            *,
            ministry:ministries(name)
          `)
          .in("volunteer_id", volunteerIds)
          .gte("schedule_date", startDate)
          .lte("schedule_date", endDate)
          .order("schedule_date")
          .order("shift_start");

        if (generalSchedules) {
          generalSchedules.forEach((schedule: any) => {
            const volunteer = volunteerData?.find(v => v.id === schedule.volunteer_id);
            allSchedules.push({
              id: schedule.id,
              date: schedule.schedule_date,
              start: schedule.shift_start?.substring(0, 5) || schedule.shift_start,
              end: schedule.shift_end?.substring(0, 5) || schedule.shift_end,
              ministry: schedule.ministry?.name || "Ministério",
              ministryId: schedule.ministry_id,
              type: schedule.schedule_type || 'primary',
              confirmed: schedule.confirmed || false,
              confirmed_at: schedule.confirmed_at,
              origin: 'general',
              notes: schedule.notes,
              is_staff: false,
              volunteer_id: schedule.volunteer_id,
              schedule_date: schedule.schedule_date,
              shift_start: schedule.shift_start,
              shift_end: schedule.shift_end,
            });
            generalCount++;
          });
        }
      }

      // SOURCE B: Staff Schedules (Infantil)
      const { data: staffData } = await supabase
        .from("ministry_staff")
        .select("id, full_name")
        .eq("profile_id", user.id)
        .eq("is_active", true);

      const staffIds = staffData?.map(s => s.id) || [];

      if (staffIds.length > 0) {
        const staffStartIso = new Date(startDate).toISOString();
        const staffEndIso = new Date(`${endDate}T23:59:59Z`).toISOString();

        const { data: infantilSchedules } = await supabase
          .from("staff_schedules")
          .select("*")
          .in("staff_id", staffIds)
          .gte("shift_start", staffStartIso)
          .lte("shift_start", staffEndIso)
          .order("shift_start");

        if (infantilSchedules) {
          infantilSchedules.forEach((schedule: any) => {
            const dt = new Date(schedule.shift_start);
            const dtEnd = new Date(schedule.shift_end);
            const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
            
            allSchedules.push({
              id: schedule.id,
              date: dateStr,
              start: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
              end: `${String(dtEnd.getHours()).padStart(2, '0')}:${String(dtEnd.getMinutes()).padStart(2, '0')}`,
              ministry: "Ministério Infantil",
              ministryId: "ministerio-infantil",
              type: 'staff',
              confirmed: schedule.confirmed || false,
              confirmed_at: schedule.confirmed_at,
              origin: 'infantil',
              notes: schedule.notes,
              classroom: schedule.classroom,
              is_staff: true,
              staff_id: schedule.staff_id,
              schedule_date: dateStr,
              shift_start: schedule.shift_start,
              shift_end: schedule.shift_end,
            });
            infantilCount++;
          });
        }
      }

      // Sort by date
      allSchedules.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.start.localeCompare(b.start);
      });

      // Calculate stats
      const stats: ScheduleStats = {
        total: allSchedules.length,
        upcoming: allSchedules.filter(s => isAfter(parseISO(s.date), now) || s.date === format(now, 'yyyy-MM-dd')).length,
        confirmed: allSchedules.filter(s => s.confirmed).length,
        pending: allSchedules.filter(s => !s.confirmed).length,
        infantil: infantilCount,
        general: generalCount,
      };

      return { schedules: allSchedules, stats };
    },
    enabled: !!user?.id,
  });

  // Confirm schedule mutation (works for both general and infantil)
  const confirmMutation = useMutation({
    mutationFn: async (schedule: UnifiedSchedule) => {
      if (schedule.origin === 'infantil') {
        const { error } = await supabase
          .from("staff_schedules")
          .update({
            confirmed: true,
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", schedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("volunteer_schedules")
          .update({
            confirmed: true,
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", schedule.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Presença confirmada!");
      queryClient.invalidateQueries({ queryKey: ["my-unified-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-data"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao confirmar presença");
    },
  });

  // Cancel confirmation mutation
  const cancelConfirmationMutation = useMutation({
    mutationFn: async (schedule: UnifiedSchedule) => {
      if (schedule.origin === 'infantil') {
        const { error } = await supabase
          .from("staff_schedules")
          .update({
            confirmed: false,
            confirmed_at: null,
          })
          .eq("id", schedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("volunteer_schedules")
          .update({
            confirmed: false,
            confirmed_at: null,
          })
          .eq("id", schedule.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Confirmação cancelada.");
      queryClient.invalidateQueries({ queryKey: ["my-unified-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-data"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cancelar confirmação");
    },
  });

  const schedulesByDate = (data?.schedules || []).reduce((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = [];
    }
    acc[schedule.date].push(schedule);
    return acc;
  }, {} as Record<string, UnifiedSchedule[]>);

  const upcomingSchedules = (data?.schedules || []).filter(s => {
    const scheduleDate = parseISO(s.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return scheduleDate >= today || s.date === format(today, 'yyyy-MM-dd');
  });

  return {
    schedules: data?.schedules || [],
    schedulesByDate,
    upcomingSchedules,
    stats: data?.stats || { total: 0, upcoming: 0, confirmed: 0, pending: 0, infantil: 0, general: 0 },
    isLoading,
    refetch,
    confirmSchedule: confirmMutation.mutateAsync,
    cancelConfirmation: cancelConfirmationMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
  };
}
