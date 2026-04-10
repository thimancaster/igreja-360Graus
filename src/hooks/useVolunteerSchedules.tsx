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
  classroom?: string | null;
  is_kids_ministry?: boolean;
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

      // Get my specific schedules
      let mySchedules: VolunteerSchedule[] = [];
      if (volunteerIds.length > 0) {
        const { data: myData } = await supabase
          .from("volunteer_schedules")
          .select(`
            *,
            ministry:ministries(name)
          `)
          .in("volunteer_id", volunteerIds)
          .gte("schedule_date", startDate)
          .lte("schedule_date", endDate)
          .order("schedule_date");
        
        mySchedules = (myData || []).map((item: any) => ({
          ...item,
          ministry_name: item.ministry?.name
        }));
      }

      // Get open schedules in my ministries
      let openSchedules: VolunteerSchedule[] = [];
      if (ministryIds.length > 0) {
        const { data: openData } = await supabase
          .from("volunteer_schedules")
          .select(`
            *,
            ministry:ministries(name)
          `)
          .in("ministry_id", ministryIds)
          .is("volunteer_id", null)
          .gte("schedule_date", startDate)
          .order("schedule_date");
          
        openSchedules = (openData || []).map((item: any) => ({
          ...item,
          ministry_name: item.ministry?.name
        }));
      }

      return { mySchedules, openSchedules };
    },
    enabled: !!user?.id,
  });

  const createSchedule = useMutation({
    mutationFn: async (data: CreateScheduleData) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.church_id) throw new Error("Church not found");

      const { error } = await supabase
        .from("volunteer_schedules")
        .insert({
          ...data,
          church_id: profile.church_id,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      toast.success("Horário criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar horário: " + error.message);
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, ...data }: Partial<VolunteerSchedule> & { id: string }) => {
      const { error } = await supabase
        .from("volunteer_schedules")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-data"] });
      toast.success("Escala atualizada!");
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("volunteer_schedules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      toast.success("Escala removida!");
    },
  });

  const confirmSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("volunteer_schedules")
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-data"] });
      toast.success("Escala confirmada!");
    },
  });

  const claimSchedule = useMutation({
    mutationFn: async ({ scheduleId, volunteerId }: { scheduleId: string; volunteerId: string }) => {
      const { error } = await supabase
        .from("volunteer_schedules")
        .update({
          volunteer_id: volunteerId,
          confirmed: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", scheduleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-volunteer-data"] });
      queryClient.invalidateQueries({ queryKey: ["volunteer-schedules"] });
      toast.success("Você assumiu esta escala!");
    },
  });

  const sendReminder = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('send-volunteer-reminder', {
        body: { scheduleId: id }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Lembrete enviado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar lembrete: " + error.message);
    }
  });

  return {
    schedules,
    isLoading,
    refetch,
    mySchedules: volunteerDataObj?.mySchedules || [],
    openSchedules: volunteerDataObj?.openSchedules || [],
    mySchedulesLoading,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    confirmSchedule,
    claimSchedule,
    sendReminder,
  };
}

export function useMyUnifiedSchedules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Buscar Schedules Gerais (volunteer_schedules)
  const { data: generalSchedules = [], isLoading: loadingGeneral } = useQuery({
    queryKey: ["my-general-schedules", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: volunteerData } = await supabase
        .from("department_volunteers")
        .select("id")
        .eq("profile_id", user.id)
        .eq("status", "active");

      const volunteerIds = volunteerData?.length ? volunteerData.map(v => v.id) : [];
      if (volunteerIds.length === 0) return [];

      const { data, error } = await supabase
        .from("volunteer_schedules")
        .select(`
          *,
          ministry:ministries(name)
        `)
        .in("volunteer_id", volunteerIds)
        .gte("schedule_date", new Date().toISOString().split('T')[0])
        .order("schedule_date");

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        origin: 'general',
        ministry_name: item.ministry?.name
      }));
    },
    enabled: !!user?.id
  });

  // 2. Buscar Schedules Infantil (staff_schedules)
  const { data: kidsSchedules = [], isLoading: loadingKids } = useQuery({
    queryKey: ["my-kids-schedules", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: staffData } = await supabase
        .from("ministry_staff")
        .select("id")
        .eq("profile_id", user.id);

      const staffIds = staffData?.length ? staffData.map(s => s.id) : [];
      if (staffIds.length === 0) return [];

      const { data, error } = await supabase
        .from("staff_schedules")
        .select(`
          *,
          classroom:ministry_classrooms(name)
        `)
        .in("staff_id", staffIds)
        .gte("schedule_date", new Date().toISOString().split('T')[0])
        .order("schedule_date");

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item,
        origin: 'infantil',
        ministry_name: "Ministério Infantil",
        classroom_name: item.classroom?.name
      }));
    },
    enabled: !!user?.id
  });

  // 3. Mutação para Confirmar (Unificada)
  const confirmSchedule = useMutation({
    mutationFn: async ({ id, origin }: { id: string, origin: 'general' | 'infantil' }) => {
      const table = origin === 'infantil' ? 'staff_schedules' : 'volunteer_schedules';
      const { error } = await supabase
        .from(table as any)
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      if (variables.origin === 'infantil') {
        queryClient.invalidateQueries({ queryKey: ["my-kids-schedules"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["my-general-schedules"] });
      }
      toast.success("Escala confirmada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao confirmar escala: " + error.message);
    }
  });

  const allSchedules = [...generalSchedules, ...kidsSchedules].sort((a, b) => 
    new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime()
  );

  return {
    allSchedules,
    isLoading: loadingGeneral || loadingKids,
    confirmSchedule
  };
}
