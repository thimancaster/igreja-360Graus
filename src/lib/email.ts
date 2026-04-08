export interface EmailPayload {
  to: string;
  subject: string;
  template: 'event_registration_confirmed' | 'event_payment_confirmed' | 'event_reminder' | 'event_waitlist';
  data: Record<string, unknown>;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  console.log('[EMAIL STUB] Would send:', payload);
  
  try {
    const { data, error } = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-event-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    }).then(res => res.json());

    if (error) {
      console.error('[EMAIL STUB] Error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[EMAIL STUB] Failed:', err);
    return false;
  }
}

export function formatEventEmailData(
  eventTitle: string,
  eventDate: string,
  attendeeName: string,
  ticketNumber?: string
) {
  return {
    event_title: eventTitle,
    event_date: eventDate,
    attendee_name: attendeeName,
    ticket_number: ticketNumber,
  };
}