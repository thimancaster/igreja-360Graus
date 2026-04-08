import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { 
  EventRegistrationExtended, 
  CreateRegistrationInput, 
  CheckinResult,
  EventCheckinStats 
} from "@/types/event-checkin";

type TicketStatus = 'reserved' | 'pending_payment' | 'paid' | 'checked_in' | 'checked_out' | 'cancelled' | 'refunded';

interface RegistrationRow {
  id: string;
  event_id: string;
  church_id: string | null;
  profile_id: string | null;
  member_id: string | null;
  child_id: string | null;
  guardian_id: string | null;
  status: string;
  payment_status: string;
  payment_amount: number | null;
  payment_date: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  ticket_number: string | null;
  notes: string | null;
  registered_at: string;
  qr_code_data: string | null;
  ticket_status: TicketStatus | null;
  checked_in_by: string | null;
  checked_out_by: string | null;
  checked_in_device: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
}

export function useEventTickets() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const churchId = profile?.church_id;

  const myTickets = useQuery({
    queryKey: ["my-tickets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          *,
          event:ministry_events(
            id, title, start_datetime, end_datetime, location, 
            cover_image_url, is_paid_event, ticket_price
          )
        `)
        .eq("profile_id", user.id)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return data as EventRegistrationExtended[];
    },
    enabled: !!user?.id,
  });

  const ticketsByEvent = (eventId: string) => useQuery({
    queryKey: ["tickets-by-event", eventId],
    queryFn: async () => {
      if (!churchId) return [];
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          *,
          event:ministry_events(id, title, start_datetime, location)
        `)
        .eq("event_id", eventId)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as EventRegistrationExtended[];
    },
    enabled: !!churchId,
  });

  const checkinStats = (eventId: string) => useQuery({
    queryKey: ["checkin-stats", eventId],
    queryFn: async (): Promise<EventCheckinStats> => {
      if (!churchId) {
        return { total_registrations: 0, checked_in: 0, checked_out: 0, pending_payment: 0, paid_not_checked_in: 0, revenue: 0, collected: 0 };
      }
      
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId);
      if (error) throw error;
      
      const registrations = (data || []) as RegistrationRow[];
      const stats: EventCheckinStats = {
        total_registrations: registrations.length,
        checked_in: registrations.filter(r => r.check_in_at !== null).length,
        checked_out: registrations.filter(r => r.check_out_at !== null).length,
        pending_payment: registrations.filter(r => r.payment_status === 'pending' || r.ticket_status === 'pending_payment').length,
        paid_not_checked_in: registrations.filter(r => 
          (r.payment_status === 'paid' || r.ticket_status === 'paid') && r.check_in_at === null
        ).length,
        revenue: registrations.reduce((sum, r) => sum + (r.payment_amount || 0), 0),
        collected: registrations
          .filter(r => r.payment_status === 'paid')
          .reduce((sum, r) => sum + (r.payment_amount || 0), 0),
      };
      
      return stats;
    },
    enabled: !!churchId,
  });

  const createRegistration = useMutation({
    mutationFn: async (input: CreateRegistrationInput) => {
      const { data: ticketNumber, error: ticketError } = await supabase
        .rpc("generate_ticket_number" as any, { p_event_id: input.event_id, p_church_id: input.church_id });
      if (ticketError) throw ticketError;

      const isPaidEvent = await checkIfEventIsPaid(input.event_id);
      const initialTicketStatus = isPaidEvent ? 'pending_payment' : 'paid';
      const initialPaymentStatus = isPaidEvent ? 'pending' : 'free';

      const { data, error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: input.event_id,
          church_id: input.church_id,
          profile_id: input.profile_id || user?.id,
          member_id: input.member_id,
          attendee_name: input.attendee_name,
          attendee_email: input.attendee_email,
          attendee_phone: input.attendee_phone,
          ticket_number: ticketNumber,
          ticket_status: initialTicketStatus,
          payment_status: initialPaymentStatus,
          status: isPaidEvent ? 'registered' : 'confirmed',
          notes: input.notes,
        } as any)
        .select(`
          *,
          event:ministry_events(
            id, title, start_datetime, end_datetime, location, 
            cover_image_url, is_paid_event, ticket_price
          )
        `)
        .single();
      
      if (error) throw error;
      return data as EventRegistrationExtended;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast.success("Inscrição realizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao realizar inscrição: ${error.message}`);
    },
  });

  const checkIn = useMutation({
    mutationFn: async ({ qrData, eventId, deviceInfo }: { qrData: string; eventId: string; deviceInfo?: string }) => {
      const { data, error } = await supabase
        .rpc("process_event_checkin" as any, {
          p_qr_data: qrData,
          p_event_id: eventId,
          p_device_info: deviceInfo,
        });
      if (error) throw error;
      return data as unknown as CheckinResult;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["checkin-stats"] });
        queryClient.invalidateQueries({ queryKey: ["tickets-by-event"] });
        toast.success(result.message || "Check-in realizado!");
      } else {
        toast.error(result.error || "Erro no check-in");
      }
      return result;
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const checkOut = useMutation({
    mutationFn: async ({ qrData, eventId, deviceInfo }: { qrData: string; eventId: string; deviceInfo?: string }) => {
      const { data, error } = await supabase
        .rpc("process_event_checkout" as any, {
          p_qr_data: qrData,
          p_event_id: eventId,
          p_device_info: deviceInfo,
        });
      if (error) throw error;
      return data as unknown as CheckinResult;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["checkin-stats"] });
        queryClient.invalidateQueries({ queryKey: ["tickets-by-event"] });
        toast.success(result.message || "Check-out realizado!");
      } else {
        toast.error(result.error || "Erro no check-out");
      }
      return result;
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const manualCheckinMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const { data, error } = await supabase
        .rpc("process_manual_checkin" as any, {
          p_registration_id: registrationId,
        });
      if (error) throw error;
      return data as unknown as CheckinResult;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["checkin-stats"] });
        queryClient.invalidateQueries({ queryKey: ["tickets-by-event"] });
        toast.success(result.message || "Check-in realizado!");
      } else {
        toast.error(result.error || "Erro no check-in");
      }
      return result;
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const manualCheckoutMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const { data, error } = await supabase
        .rpc("process_manual_checkout" as any, {
          p_registration_id: registrationId,
        });
      if (error) throw error;
      return data as unknown as CheckinResult;
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["checkin-stats"] });
        queryClient.invalidateQueries({ queryKey: ["tickets-by-event"] });
        toast.success(result.message || "Check-out realizado!");
      } else {
        toast.error(result.error || "Erro no check-out");
      }
      return result;
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ 
      registrationId, 
      status, 
      paymentId 
    }: { 
      registrationId: string; 
      status: 'paid' | 'pending' | 'refunded';
      paymentId?: string;
    }) => {
      const updateData: Record<string, unknown> = {
        payment_status: status,
        ticket_status: status === 'paid' ? 'paid' : status === 'refunded' ? 'refunded' : 'pending_payment',
      };
      
      if (status === 'paid') {
        updateData.payment_date = new Date().toISOString();
      }
      
      if (paymentId) {
        updateData.external_payment_id = paymentId;
      }
      
      const { error } = await supabase
        .from("event_registrations")
        .update(updateData)
        .eq("id", registrationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["checkin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["tickets-by-event"] });
      toast.success("Status de pagamento atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar pagamento"),
  });

  const cancelRegistration = useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({
          status: 'cancelled',
          ticket_status: 'cancelled',
        })
        .eq("id", registrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      toast.success("Inscrição cancelada!");
    },
    onError: () => toast.error("Erro ao cancelar inscrição"),
  });

  const generateQRTicketData = async (registration: EventRegistrationExtended): Promise<string> => {
    if (registration.qr_code_data) {
      return registration.qr_code_data;
    }

    const qrData = {
      id: registration.id,
      ticket: registration.ticket_number,
      event: registration.event_id,
      church: registration.church_id,
      ts: Date.now(),
      sig: btoa(`${registration.id}${registration.ticket_number}${Date.now()}`).slice(0, 20),
    };

    const encoded = btoa(JSON.stringify(qrData));

    await supabase
      .from("event_registrations")
      .update({ qr_code_data: encoded } as any)
      .eq("id", registration.id);

    return encoded;
  };

  const checkIfEventIsPaid = async (eventId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("ministry_events")
      .select("is_paid_event, ticket_price")
      .eq("id", eventId)
      .single();
    
    return data?.is_paid_event === true && (data?.ticket_price || 0) > 0;
  };

  return {
    myTickets,
    ticketsByEvent,
    checkinStats,
    createRegistration: createRegistration.mutateAsync,
    checkIn: checkIn.mutateAsync,
    checkOut: checkOut.mutateAsync,
    manualCheckin: manualCheckinMutation,
    manualCheckout: manualCheckoutMutation,
    updatePaymentStatus: updatePaymentStatus.mutateAsync,
    cancelRegistration: cancelRegistration.mutateAsync,
    generateQRTicketData,
    isCreating: createRegistration.isPending,
    isCheckingIn: checkIn.isPending,
    isCheckingOut: checkOut.isPending,
  };
}
