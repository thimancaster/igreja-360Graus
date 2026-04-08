import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EventWaitlistEntry {
  id: string;
  church_id: string;
  event_id: string;
  registration_id: string;
  attendee_name: string;
  attendee_email: string | null;
  attendee_phone: string | null;
  position: number;
  status: 'waiting' | 'notified' | 'converted' | 'cancelled';
  added_at: string;
  converted_at: string | null;
  event?: {
    title: string;
    max_capacity: number;
    current_registrations: number;
  };
}

export function useEventWaitlist(eventId?: string) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const churchId = profile?.church_id;

  const waitlistEntries = useQuery({
    queryKey: ["event-waitlist", eventId],
    queryFn: async (): Promise<EventWaitlistEntry[]> => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from("event_waitlist")
        .select(`
          *,
          event:ministry_events(
            title,
            max_capacity,
            current_registrations:event_registrations(count)
          )
        `)
        .eq("event_id", eventId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  const addToWaitlist = useMutation({
    mutationFn: async (data: {
      eventId: string;
      attendeeName: string;
      attendeeEmail?: string;
      attendeePhone?: string;
    }) => {
      const { error } = await supabase
        .from("event_waitlist")
        .insert({
          church_id: churchId,
          event_id: data.eventId,
          attendee_name: data.attendeeName,
          attendee_email: data.attendeeEmail,
          attendee_phone: data.attendeePhone,
          position: 1,
          status: "waiting",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-waitlist"] });
      toast.success("Adicionado à lista de espera!");
    },
    onError: () => {
      toast.error("Erro ao adicionar à lista de espera");
    },
  });

  const removeFromWaitlist = useMutation({
    mutationFn: async (waitlistId: string) => {
      const { error } = await supabase
        .from("event_waitlist")
        .update({ status: "cancelled" })
        .eq("id", waitlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-waitlist"] });
      toast.success("Removido da lista de espera");
    },
    onError: () => {
      toast.error("Erro ao remover da lista de espera");
    },
  });

  const convertToRegistration = useMutation({
    mutationFn: async (waitlistId: string) => {
      const { data: entry } = await supabase
        .from("event_waitlist")
        .select("*")
        .eq("id", waitlistId)
        .single();

      if (!entry) throw new Error("Entrada não encontrada");

      const { data: ticketNumber } = await supabase
        .rpc("generate_ticket_number" as any, { 
          p_event_id: entry.event_id, 
          p_church_id: entry.church_id 
        });

      const { error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: entry.event_id,
          church_id: entry.church_id,
          attendee_name: entry.attendee_name,
          attendee_email: entry.attendee_email,
          attendee_phone: entry.attendee_phone,
          ticket_number: ticketNumber,
          status: "registered",
          ticket_status: "paid",
          payment_status: "free",
        });

      if (error) throw error;

      await supabase
        .from("event_waitlist")
        .update({ status: "converted", converted_at: new Date().toISOString() })
        .eq("id", waitlistId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["tickets-by-event"] });
      toast.success("Convertido para inscrição!");
    },
    onError: () => {
      toast.error("Erro ao converter para inscrição");
    },
  });

  return {
    waitlist: waitlistEntries.data || [],
    isLoading: waitlistEntries.isLoading,
    addToWaitlist,
    removeFromWaitlist,
    convertToRegistration,
    refetch: waitlistEntries.refetch,
  };
}

export function useEventWaitlistCount(eventId?: string) {
  return useQuery({
    queryKey: ["event-waitlist-count", eventId],
    queryFn: async () => {
      if (!eventId) return 0;
      
      const { count, error } = await supabase
        .from("event_waitlist")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "waiting");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId,
  });
}