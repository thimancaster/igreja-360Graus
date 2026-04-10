import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EventReminder {
  id: string;
  church_id: string;
  event_id: string;
  reminder_date: string;
  message: string;
  is_sent: boolean;
  sent_at: string | null;
  created_by: string;
  event?: {
    title: string;
    start_datetime: string;
    location: string | null;
  };
}

export function useEventReminders(eventId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const churchId = profile?.church_id;

  const reminders = useQuery({
    queryKey: ["event-reminders", eventId, churchId],
    queryFn: async (): Promise<EventReminder[]> => {
      if (!churchId) return [];
      
      let query = supabase
        .from("event_reminders")
        .select(`
          *,
          event:ministry_events(title, start_datetime, location)
        `)
        .eq("church_id", churchId)
        .order("reminder_date", { ascending: true });

      if (eventId) {
        query = query.eq("event_id", eventId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!churchId,
  });

  const createReminder = useMutation({
    mutationFn: async (data: {
      eventId: string;
      reminderDate: string;
      message: string;
    }) => {
      const { error } = await supabase
        .from("event_reminders")
        .insert({
          church_id: churchId,
          event_id: data.eventId,
          reminder_date: data.reminderDate,
          message: data.message,
          is_sent: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-reminders"] });
      toast.success("Lembrete criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar lembrete");
    },
  });

  const deleteReminder = useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from("event_reminders")
        .delete()
        .eq("id", reminderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-reminders"] });
      toast.success("Lembrete removido");
    },
    onError: () => {
      toast.error("Erro ao remover lembrete");
    },
  });

  const upcomingReminders = useQuery({
    queryKey: ["upcoming-event-reminders", churchId],
    queryFn: async (): Promise<EventReminder[]> => {
      if (!churchId) return [];
      
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("event_reminders")
        .select(`
          *,
          event:ministry_events(title, start_datetime, location)
        `)
        .eq("church_id", churchId)
        .eq("is_sent", false)
        .gte("reminder_date", now)
        .order("reminder_date", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!churchId,
  });

  return {
    reminders: reminders.data || [],
    isLoading: reminders.isLoading,
    upcomingReminders: upcomingReminders.data || [],
    createReminder,
    deleteReminder,
    refetch: reminders.refetch,
  };
}

export function useUpcomingEventReminders() {
  const { profile } = useAuth();
  const churchId = profile?.church_id;

  return useQuery({
    queryKey: ["upcoming-reminders-dashboard", churchId],
    queryFn: async (): Promise<EventReminder[]> => {
      if (!churchId) return [];
      
      const now = new Date().toISOString();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("event_reminders")
        .select(`
          *,
          event:ministry_events(title, start_datetime, location)
        `)
        .eq("church_id", churchId)
        .eq("is_sent", false)
        .gte("reminder_date", now)
        .lte("reminder_date", nextWeek)
        .order("reminder_date", { ascending: true })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!churchId,
  });
}