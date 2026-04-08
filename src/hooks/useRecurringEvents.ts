import { addDays, addWeeks, addMonths, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RecurrenceConfig {
  type: "daily" | "weekly" | "monthly";
  interval: number;
  occurrences?: number;
  endDate?: string;
}

export function useRecurringEvents() {
  const { profile } = useAuth();
  const churchId = profile?.church_id;

  const generateRecurringEvents = async (
    baseEvent: {
      title: string;
      description?: string;
      event_type: string;
      start_datetime: string;
      end_datetime?: string;
      all_day?: boolean;
      location?: string;
      max_capacity?: number | null;
      registration_required?: boolean;
      registration_deadline?: string | null;
      ministry_id?: string | null;
      ticket_price?: number;
      is_paid_event?: boolean;
      auto_register_finance?: boolean;
      enable_waitlist?: boolean;
      visibility?: string;
      tags?: string[];
    },
    recurrence: RecurrenceConfig,
    occurrences: number = 10
  ): Promise<string[]> => {
    if (!churchId) throw new Error("Igreja não encontrada");

    const createdEventIds: string[] = [];
    let currentStartDate = new Date(baseEvent.start_datetime);
    const baseEndDate = baseEvent.end_datetime ? new Date(baseEvent.end_datetime) : null;

    for (let i = 0; i < occurrences; i++) {
      let nextStartDate: Date;
      let nextEndDate: Date | null = null;

      switch (recurrence.type) {
        case "daily":
          nextStartDate = addDays(currentStartDate, recurrence.interval);
          if (baseEndDate) {
            nextEndDate = addDays(baseEndDate, recurrence.interval);
          }
          break;
        case "weekly":
          nextStartDate = addWeeks(currentStartDate, recurrence.interval);
          if (baseEndDate) {
            nextEndDate = addWeeks(baseEndDate, recurrence.interval);
          }
          break;
        case "monthly":
          nextStartDate = addMonths(currentStartDate, recurrence.interval);
          if (baseEndDate) {
            nextEndDate = addMonths(baseEndDate, recurrence.interval);
          }
          break;
        default:
          nextStartDate = addWeeks(currentStartDate, 1);
      }

      const eventData = {
        ...baseEvent,
        church_id: churchId,
        start_datetime: nextStartDate.toISOString(),
        end_datetime: nextEndDate ? nextEndDate.toISOString() : null,
        recurrence_rule: recurrence.interval > 1 
          ? JSON.stringify({ type: recurrence.type, interval: recurrence.interval, is_series: true })
          : JSON.stringify({ type: recurrence.type, interval: 1, is_series: true }),
        recurring: true,
        parent_event_id: i === 0 ? null : createdEventIds[0],
      };

      const { data, error } = await supabase
        .from("ministry_events")
        .insert(eventData)
        .select("id")
        .single();

      if (error) {
        console.error("Error creating recurring event:", error);
        throw error;
      }

      if (data) {
        createdEventIds.push(data.id);
      }

      currentStartDate = nextStartDate;
    }

    return createdEventIds;
  };

  const getRecurrencePreview = (
    startDate: string,
    recurrence: RecurrenceConfig,
    occurrences: number = 5
  ): string[] => {
    const dates: string[] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < occurrences; i++) {
      dates.push(format(currentDate, "dd/MM/yyyy"));

      switch (recurrence.type) {
        case "daily":
          currentDate = addDays(currentDate, recurrence.interval);
          break;
        case "weekly":
          currentDate = addWeeks(currentDate, recurrence.interval);
          break;
        case "monthly":
          currentDate = addMonths(currentDate, recurrence.interval);
          break;
      }
    }

    return dates;
  };

  return {
    generateRecurringEvents,
    getRecurrencePreview,
  };
}