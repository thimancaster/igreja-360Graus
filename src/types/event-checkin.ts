export type PaymentGateway = 'pix' | 'credit_card' | 'debit_card' | 'boleto' | 'mercadopago' | 'stripe';

export type TicketStatus = 'reserved' | 'pending_payment' | 'paid' | 'checked_in' | 'checked_out' | 'cancelled' | 'refunded';

export interface EventRegistrationExtended {
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
  payment_gateway: PaymentGateway | null;
  external_payment_id: string | null;
  pix_qr_code: string | null;
  pix_expiration: string | null;
  checked_in_by: string | null;
  checked_out_by: string | null;
  checked_in_device: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  origin?: string;
  source_reference?: string;
  finance_registered?: boolean;
  finance_registered_by?: string;
  finance_registered_at?: string;
  event?: {
    id: string;
    title: string;
    start_datetime: string;
    end_datetime: string | null;
    location: string | null;
    cover_image_url: string | null;
    is_paid_event: boolean | null;
    ticket_price: number | null;
  };
}

export interface PaymentWebhook {
  id: string;
  church_id: string;
  gateway: PaymentGateway;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface PaymentSettings {
  id: string;
  church_id: string;
  gateway: PaymentGateway;
  is_active: boolean;
  mercadopago_access_token: string | null;
  mercadopago_public_key: string | null;
  mercadopago_webhook_secret: string | null;
  stripe_secret_key: string | null;
  stripe_webhook_secret: string | null;
  stripe_publishable_key: string | null;
  pix_expiration_minutes: number | null;
  payment_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventCheckinLog {
  id: string;
  church_id: string;
  registration_id: string;
  event_id: string;
  action: 'check_in' | 'check_out' | 'invalid_qr' | 'already_checked_in' | 'payment_required';
  performed_by: string | null;
  device_info: string | null;
  ip_address: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface CheckinResult {
  success: boolean;
  error?: string;
  code?: string;
  message?: string;
  registration?: {
    id: string;
    ticket_number: string;
    attendee_name: string | null;
    payment_status: string;
    photo_url?: string | null;
    check_in_at?: string;
  };
  registration_id?: string;
  checked_in_at?: string;
}

export interface QRTicketData {
  id: string;
  ticket: string;
  event: string;
  church: string;
  ts: number;
  sig: string;
}

export interface EventCheckinStats {
  total_registrations: number;
  checked_in: number;
  checked_out: number;
  pending_payment: number;
  paid_not_checked_in: number;
  revenue: number;
  collected: number;
}

export interface CreateRegistrationInput {
  event_id: string;
  church_id: string;
  profile_id?: string;
  member_id?: string;
  attendee_name: string;
  attendee_email?: string;
  attendee_phone?: string;
  notes?: string;
}

export interface CreatePaymentInput {
  registration_id: string;
  gateway: PaymentGateway;
  amount: number;
  external_payment_id?: string;
  pix_qr_code?: string;
  pix_expiration?: string;
}

export interface EventRevenueAuthorization {
  id: string;
  church_id: string;
  registration_id: string;
  event_id: string;
  amount: number;
  member_id?: string;
  status: 'pending' | 'authorized' | 'rejected';
  authorized_by?: string;
  authorized_at?: string;
  created_at: string;
  event?: {
    title: string;
  };
  member?: {
    full_name: string;
  };
}

export interface EventWithFinanceSettings {
  id: string;
  title: string;
  start_datetime: string;
  auto_register_finance: boolean;
}
