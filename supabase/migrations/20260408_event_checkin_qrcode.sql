-- ==========================================
-- Migration: Sistema de Check-in com QR Code para Eventos Pagos
-- ==========================================

-- 1. Enum para status de pagamento
DO $$ BEGIN
    CREATE TYPE public.payment_gateway AS ENUM ('pix', 'credit_card', 'debit_card', 'boleto', 'mercadopago', 'stripe');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ticket_status AS ENUM ('reserved', 'pending_payment', 'paid', 'checked_in', 'checked_out', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar campos na tabela event_registrations
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS qr_code_data text,
ADD COLUMN IF NOT EXISTS ticket_status ticket_status DEFAULT 'reserved',
ADD COLUMN IF NOT EXISTS payment_gateway payment_gateway,
ADD COLUMN IF NOT EXISTS external_payment_id text,
ADD COLUMN IF NOT EXISTS pix_qr_code text,
ADD COLUMN IF NOT EXISTS pix_expiration timestamptz,
ADD COLUMN IF NOT EXISTS checked_in_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS checked_out_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS checked_in_device text,
ADD COLUMN IF NOT EXISTS attendee_name text,
ADD COLUMN IF NOT EXISTS attendee_email text,
ADD COLUMN IF NOT EXISTS attendee_phone text;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_event_registrations_ticket_number ON public.event_registrations(ticket_number);
CREATE INDEX IF NOT EXISTS idx_event_registrations_ticket_status ON public.event_registrations(ticket_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_qr_data ON public.event_registrations(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment ON public.event_registrations(external_payment_id);

-- 4. Tabela de webhooks para notificações de pagamento
CREATE TABLE IF NOT EXISTS public.payment_webhooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
    gateway payment_gateway NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    processed boolean DEFAULT false,
    processed_at timestamptz,
    error_message text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_church ON public.payment_webhooks(church_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON public.payment_webhooks(processed, created_at DESC);

-- 5. Tabela de configuração de gateway de pagamento por igreja
CREATE TABLE IF NOT EXISTS public.payment_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
    gateway payment_gateway NOT NULL,
    is_active boolean DEFAULT true,
    -- MercadoPago
    mercadopago_access_token text,
    mercadopago_public_key text,
    mercadopago_webhook_secret text,
    -- Stripe
    stripe_secret_key text,
    stripe_webhook_secret text,
    stripe_publishable_key text,
    -- Configurações gerais
    pix_expiration_minutes integer DEFAULT 30,
    payment_instructions text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (church_id, gateway)
);

CREATE INDEX IF NOT EXISTS idx_payment_settings_church ON public.payment_settings(church_id);

-- 6. Tabela para logs de check-in
CREATE TABLE IF NOT EXISTS public.event_checkin_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id uuid REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
    registration_id uuid REFERENCES public.event_registrations(id) ON DELETE CASCADE NOT NULL,
    event_id uuid REFERENCES public.ministry_events(id) ON DELETE CASCADE NOT NULL,
    action text NOT NULL, -- 'check_in' | 'check_out' | 'invalid_qr' | 'already_checked_in' | 'payment_required'
    performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    device_info text,
    ip_address text,
    details jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_checkin_logs_event ON public.event_checkin_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_checkin_logs_registration ON public.event_checkin_logs(registration_id);
CREATE INDEX IF NOT EXISTS idx_checkin_logs_created ON public.event_checkin_logs(created_at DESC);

-- 7. Função para gerar ticket number único
CREATE OR REPLACE FUNCTION public.generate_ticket_number(p_event_id uuid, p_church_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_count integer;
    v_random text;
    v_ticket text;
BEGIN
    SELECT COUNT(*) + 1 INTO v_count 
    FROM public.event_registrations 
    WHERE event_id = p_event_id;
    
    v_random := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    v_ticket := 'TKT-' || upper(substring(p_event_id::text from 1 for 4)) || '-' || 
                to_char(v_count, 'FM0000') || '-' || v_random;
    
    RETURN v_ticket;
END;
$$;

-- 8. Função para gerar QR code data
CREATE OR REPLACE FUNCTION public.generate_qr_code_data(p_registration_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_data text;
    v_registration record;
BEGIN
    SELECT * INTO v_registration FROM public.event_registrations WHERE id = p_registration_id;
    
    v_data := json_build_object(
        'id', p_registration_id,
        'ticket', v_registration.ticket_number,
        'event', v_registration.event_id,
        'church', v_registration.church_id,
        'ts', extract(epoch from now())::bigint,
        'sig', md5(p_registration_id::text || v_registration.ticket_number || now()::text)
    )::text;
    
    RETURN encode(v_data::bytea, 'base64');
END;
$$;

-- 9. Função para processar check-in via QR code
CREATE OR REPLACE FUNCTION public.process_event_checkin(
    p_qr_data text,
    p_event_id uuid,
    p_device_info text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_decoded text;
    v_json jsonb;
    v_registration record;
    v_result jsonb;
    v_church_id uuid;
    v_user_id uuid;
BEGIN
    -- Decodificar QR code
    BEGIN
        v_decoded := convert_from(decode(p_qr_data, 'base64'), 'UTF8');
        v_json := v_decoded::jsonb;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'QR code inválido',
            'code', 'INVALID_QR'
        );
    END;
    
    -- Verificar se o ingresso existe
    SELECT * INTO v_registration
    FROM public.event_registrations er
    JOIN public.ministry_events me ON me.id = er.event_id
    WHERE er.id = (v_json->>'id')::uuid
      AND er.ticket_number = v_json->>'ticket'
      AND er.event_id = p_event_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Ingresso não encontrado ou não pertence a este evento',
            'code', 'TICKET_NOT_FOUND'
        );
    END IF;
    
    v_church_id := v_registration.church_id;
    v_user_id := auth.uid();
    
    -- Verificar status do pagamento
    IF v_registration.payment_status = 'pending' AND v_registration.ticket_status = 'pending_payment' THEN
        INSERT INTO public.event_checkin_logs (church_id, registration_id, event_id, action, device_info, details)
        VALUES (v_church_id, v_registration.id, p_event_id, 'payment_required', p_device_info, 
                jsonb_build_object('reason', 'Pagamento pendente'));
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Pagamento pendente. Regularize sua inscrição.',
            'code', 'PAYMENT_REQUIRED',
            'registration_id', v_registration.id
        );
    END IF;
    
    -- Verificar se já está presente
    IF v_registration.check_in_at IS NOT NULL THEN
        INSERT INTO public.event_checkin_logs (church_id, registration_id, event_id, action, device_info, details)
        VALUES (v_church_id, v_registration.id, p_event_id, 'already_checked_in', p_device_info,
                jsonb_build_object('checked_in_at', v_registration.check_in_at));
        
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Este ingresso já foi utilizado para entrada',
            'code', 'ALREADY_CHECKED_IN',
            'checked_in_at', v_registration.check_in_at
        );
    END IF;
    
    -- Realizar check-in
    UPDATE public.event_registrations
    SET check_in_at = now(),
        checked_in_by = v_user_id,
        checked_in_device = p_device_info,
        status = 'checked_in',
        ticket_status = 'checked_in'
    WHERE id = v_registration.id;
    
    INSERT INTO public.event_checkin_logs (church_id, registration_id, event_id, action, performed_by, device_info)
    VALUES (v_church_id, v_registration.id, p_event_id, 'check_in', v_user_id, p_device_info);
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Check-in realizado com sucesso!',
        'registration', jsonb_build_object(
            'id', v_registration.id,
            'ticket_number', v_registration.ticket_number,
            'attendee_name', v_registration.attendee_name,
            'payment_status', v_registration.payment_status
        )
    );
END;
$$;

-- 10. Função para processar check-out via QR code
CREATE OR REPLACE FUNCTION public.process_event_checkout(
    p_qr_data text,
    p_event_id uuid,
    p_device_info text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_decoded text;
    v_json jsonb;
    v_registration record;
    v_church_id uuid;
    v_user_id uuid;
BEGIN
    BEGIN
        v_decoded := convert_from(decode(p_qr_data, 'base64'), 'UTF8');
        v_json := v_decoded::jsonb;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'error', 'QR code inválido', 'code', 'INVALID_QR');
    END;
    
    SELECT * INTO v_registration
    FROM public.event_registrations er
    WHERE er.id = (v_json->>'id')::uuid
      AND er.ticket_number = v_json->>'ticket'
      AND er.event_id = p_event_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Ingresso não encontrado', 'code', 'TICKET_NOT_FOUND');
    END IF;
    
    IF v_registration.check_in_at IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pessoa não fez check-in', 'code', 'NOT_CHECKED_IN');
    END IF;
    
    IF v_registration.check_out_at IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Check-out já realizado', 'code', 'ALREADY_CHECKED_OUT');
    END IF;
    
    v_church_id := v_registration.church_id;
    v_user_id := auth.uid();
    
    UPDATE public.event_registrations
    SET check_out_at = now(),
        checked_out_by = v_user_id,
        status = 'checked_out',
        ticket_status = 'checked_out'
    WHERE id = v_registration.id;
    
    INSERT INTO public.event_checkin_logs (church_id, registration_id, event_id, action, performed_by, device_info)
    VALUES (v_church_id, v_registration.id, p_event_id, 'check_out', v_user_id, p_device_info);
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Check-out realizado!',
        'registration', jsonb_build_object(
            'id', v_registration.id,
            'ticket_number', v_registration.ticket_number,
            'attendee_name', v_registration.attendee_name,
            'check_in_at', v_registration.check_in_at
        )
    );
END;
$$;

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_checkin_logs ENABLE ROW LEVEL SECURITY;

-- Payment Webhooks
CREATE POLICY "Admins can manage payment_webhooks" ON public.payment_webhooks FOR ALL
USING (church_id = get_user_church_id());

-- Payment Settings
CREATE POLICY "Admins can manage payment_settings" ON public.payment_settings FOR ALL
USING (church_id = get_user_church_id());

-- Event Checkin Logs
CREATE POLICY "Users can view checkin logs of their church" ON public.event_checkin_logs FOR SELECT
USING (church_id = get_user_church_id());

CREATE POLICY "Users can insert checkin logs" ON public.event_checkin_logs FOR INSERT
WITH CHECK (church_id = get_user_church_id());

-- Atualizar políticas existentes para event_registrations
DROP POLICY IF EXISTS "select_event_registrations" ON public.event_registrations;
CREATE POLICY "select_event_registrations" ON public.event_registrations FOR SELECT TO authenticated
USING (church_id = get_user_church_id() OR profile_id = auth.uid());

DROP POLICY IF EXISTS "insert_event_registrations" ON public.event_registrations;
CREATE POLICY "insert_event_registrations" ON public.event_registrations FOR INSERT TO authenticated
WITH CHECK (church_id = get_user_church_id() OR profile_id = auth.uid());

DROP POLICY IF EXISTS "update_event_registrations" ON public.event_registrations;
CREATE POLICY "update_event_registrations" ON public.event_registrations FOR UPDATE TO authenticated
USING (profile_id = auth.uid() OR church_id = get_user_church_id());

-- Permissão para função de checkin (executar sem restrictions)
GRANT EXECUTE ON FUNCTION public.process_event_checkin TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_event_checkout TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_ticket_number TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_qr_code_data TO authenticated;
