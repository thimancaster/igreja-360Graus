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
  whatsapp_reminder_sent?: boolean;
  is_staff?: boolean;
<<<<<<< HEAD
  classroom?: string | null;
  is_kids_ministry?: boolean;
=======
>>>>>>> ea0e00c26700a4a8024edb0266eac8019f4f032c
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .single();

      const churchId = profile?.church_id;

      const { data: volunteerData } = await supabase
        .from("department_volunteers")
        .select("id, ministry_id, ministries(name)")
        .eq("profile_id", user.id)
        .eq("status", "active");

      const volunteerIds = volunteerData?.length ? volunteerData.map(v => v.id) : [];
      const ministryIds = volunteerData?.length ? volunteerData.map(v => v.ministry_id) : [];
<<<<<<< HEAD

      // fetch assigned schedules
      let assignedData: any[] = [];
      if (volunteerIds.length > 0) {
        const { data, error } = await supabase
          .from("volunteer_schedules")
          .select("*")
          .in("volunteer_id", volunteerIds)
          .gte("schedule_date", startDate)
          .lte("schedule_date", endDate)
          .order("schedule_date")
          .order("shift_start");
        if (error) throw error;
        assignedData = data || [];
      }

      // fetch staff schedules - Robust link by Profile OR Email
      const { data: profileStaff } = await supabase
        .from("ministry_staff")
        .select("id")
        .eq("profile_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      let staffId = profileStaff?.id;

      if (!staffId && user.email) {
        const { data: emailStaff } = await supabase
          .from("ministry_staff")
          .select("id, profile_id")
          .ilike("email", user.email)
          .eq("is_active", true)
          .maybeSingle();
        
        if (emailStaff) {
          staffId = emailStaff.id;
          if (!emailStaff.profile_id) {
            await supabase
              .from("ministry_staff")
              .update({ profile_id: user.id })
              .eq("id", staffId);
          }
        }
      }

      let staffSchedules: any[] = [];
      if (staffId) {
        const staffStartIso = new Date(startDate).toISOString();
        const staffEndIso = new Date(`${endDate}T23:59:59Z`).toISOString();
        const { data: staffDataResults } = await supabase
          .from("staff_schedules")
          .select("*")
          .eq("staff_id", staffId)
          .gte("shift_start", staffStartIso)
          .lte("shift_start", staffEndIso)
          .order("shift_start");
          
        if (staffDataResults) {
          staffSchedules = staffDataResults.map((s) => {
            const dt = new Date(s.shift_start);
            const dtEnd = new Date(s.shift_end);
            return {
               id: s.id,
               church_id: s.church_id,
               ministry_id: "ministerio-infantil-staff",
               volunteer_id: s.staff_id,
               schedule_date: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`,
               shift_start: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
               shift_end: `${String(dtEnd.getHours()).padStart(2, '0')}:${String(dtEnd.getMinutes()).padStart(2, '0')}`,
               confirmed: s.confirmed,
               confirmed_at: s.confirmed_at,
               notes: (s.classroom ? `[${s.classroom}] ` : "") + (s.notes || ""),
               is_staff: true,
               is_kids_ministry: true,
               classroom: s.classroom,
               ministry_name: "Ministério Infantil",
             };
          });
        }
      }

      // fetch open schedules
      const { data: openData } = await supabase
=======

      // fetch assigned schedules (only if user has volunteer records)
      let assignedData: any[] = [];
      if (volunteerIds.length > 0) {
        const { data, error } = await supabase
          .from("volunteer_schedules")
          .select("*")
          .in("volunteer_id", volunteerIds)
          .gte("schedule_date", startDate)
          .lte("schedule_date", endDate)
          .order("schedule_date")
          .order("shift_start");
        if (error) throw error;
        assignedData = data || [];
      }

      // fetch STAFF schedules for Ministério Infantil
      const { data: staffDataObj } = await supabase
        .from("ministry_staff")
        .select("id")
        .eq("profile_id", user.id)
        .eq("is_active", true);

      let staffSchedules: any[] = [];
      const staffIds = staffDataObj?.length ? staffDataObj.map((s) => s.id) : [];

      if (staffIds.length > 0) {
        // Convert YYYY-MM-DD to ISO date for timezone comparison logic in staff_schedules
        const staffStartIso = new Date(startDate).toISOString();
        const staffEndIso = new Date(`${endDate}T23:59:59Z`).toISOString();
        const { data: staffDataResults } = await supabase
          .from("staff_schedules")
          .select("*")
          .in("staff_id", staffIds)
          .gte("shift_start", staffStartIso)
          .lte("shift_start", staffEndIso)
          .order("shift_start");
          
        if (staffDataResults) {
          staffSchedules = staffDataResults.map((s) => {
            const dt = new Date(s.shift_start);
            const dtEnd = new Date(s.shift_end);
            return {
               id: s.id,
               church_id: s.church_id,
               ministry_id: "ministerio-infantil-staff", // Dummy map
               volunteer_id: s.staff_id,
               schedule_date: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`,
               shift_start: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
               shift_end: `${String(dtEnd.getHours()).padStart(2, '0')}:${String(dtEnd.getMinutes()).padStart(2, '0')}`,
               confirmed: s.confirmed,
               confirmed_at: s.confirmed_at,
               notes: (s.classroom ? `[${s.classroom}] ` : "") + (s.notes || ""),
               is_staff: true,
               ministry_name: "Ministério Infantil",
             };
          });
        }
      }

      // fetch OVERALL open schedules for the church
      const { data: openData, error: openError } = await supabase
>>>>>>> ea0e00c26700a4a8024edb0266eac8019f4f032c
        .from("volunteer_schedules")
        .select(`*, ministries!inner(name)`)
        .eq("church_id", churchId)
        .is("volunteer_id", null)
        .gte("schedule_date", startDate)
        .lte("schedule_date", endDate)
        .order("schedule_date")
        .order("shift_start");

      const now = new Date().toISOString();
      const validOpenData = (openData || []).filter((s: any) => !s.accept_until || s.accept_until > now);

      const regularSchedules = (assignedData || []).map((schedule: any) => {
        const volunteer = volunteerData?.find(v => v.id === schedule.volunteer_id);
        return {
          ...schedule,
          ministry_name: (volunteer?.ministries as any)?.name || "Ministério",
          is_staff: false
        };
      });

<<<<<<< HEAD
      const mySchedules = [...regularSchedules, ...staffSchedules].sort((a,b) => 
        new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime()
      ) as VolunteerSchedule[];
=======
      const mySchedules = [...regularSchedules, ...staffSchedules] as VolunteerSchedule[];

      // Sort final unified array
      mySchedules.sort((a,b) => new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime());
>>>>>>> ea0e00c26700a4a8024edb0266eac8019f4f032c

      const openSchedules = validOpenData.map((schedule: any) => {
        return {
          ...schedule,
          ministry_name: schedule.ministries?.name || "Ministério",
        };
      }) as VolunteerSchedule[];

      return { mySchedules, openSchedules, volunteerData: volunteerData || [], hasKidsStaff: !!staffId };
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
<<<<<<< HEAD
=======
      // Determine if schedule is staff or general volunteer
>>>>>>> ea0e00c26700a4a8024edb0266eac8019f4f032c
      const schedule = volunteerDataObj?.mySchedules?.find(s => s.id === scheduleId);
      const isStaff = schedule && (schedule as any).is_staff;
      const table = isStaff ? "staff_schedules" : "volunteer_schedules";

      const { error } = await supabase
        .from(table)
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
      queryClient.invalidateQueries({ queryKey: ["staff-schedules"] });
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

      let volunteerIdToAssign = null;
      const activeVol = volunteerDataObj?.volunteerData?.find((v) => v.ministry_id === scheduleToClaim.ministry_id);
      
      if (activeVol) {
        volunteerIdToAssign = activeVol.id;
      } else {
<<<<<<< HEAD
=======
        // Autoregister the user seamlessly into this ministry to close the loop
>>>>>>> ea0e00c26700a4a8024edb0266eac8019f4f032c
        const { data: profile } = await supabase.from("profiles").select("church_id, full_name").eq("id", user?.id).single();
        
        const { data: newVol, error: volErr } = await supabase.from("department_volunteers").insert({
          church_id: profile?.church_id,
          ministry_id: scheduleToClaim.ministry_id,
          profile_id: user?.id,
          full_name: profile?.full_name || "Voluntário",
<<<<<<< HEAD
=======
          phone: null,
>>>>>>> ea0e00c26700a4a8024edb0266eac8019f4f032c
          status: "active",
          is_active: true
        }).select().single();
        
        if (volErr) throw volErr;
        volunteerIdToAssign = newVol.id;
      }

      const { error } = await supabase
        .from("volunteer_schedules")
        .update({
          volunteer_id: volunteerIdToAssign,
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
    const hasGeneralConflict = (schedules || []).some(s => {
      if (excludeId && s.id === excludeId) return false;
      if (s.volunteer_id !== volunteerId || s.schedule_date !== date) return false;
      return (start < s.shift_end && end > s.shift_start);
    });

    if (hasGeneralConflict) return true;

    return (volunteerDataObj?.mySchedules || []).some(s => {
       if (excludeId && s.id === excludeId) return false;
       if (s.schedule_date !== date) return false;
       return (start < s.shift_end && end > s.shift_start);
    });
  };

  return {
    schedules: schedules || [],
    schedulesByDate,
    mySchedules: volunteerDataObj?.mySchedules || [],
    openSchedules: volunteerDataObj?.openSchedules || [],
    volunteerData: volunteerDataObj?.volunteerData || [],
    hasKidsStaff: !!volunteerDataObj?.hasKidsStaff,
    isLoading: isLoading || mySchedulesLoading,
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
