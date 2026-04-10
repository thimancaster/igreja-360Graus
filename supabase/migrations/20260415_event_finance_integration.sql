-- =====================================================
-- FASE 1: Integração Financeira de Eventos
-- Migration: event_finance_integration
-- =====================================================

-- 1. Adicionar campos em event_registrations
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS origin text DEFAULT 'evento_pago',
ADD COLUMN IF NOT EXISTS source_reference uuid REFERENCES ministry_events(id),
ADD COLUMN IF NOT EXISTS finance_registered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS finance_registered_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS finance_registered_at timestamptz;

-- 2. Adicionar campo em ministry_events  
ALTER TABLE ministry_events
ADD COLUMN IF NOT EXISTS auto_register_finance boolean DEFAULT false;

-- 3. Nova tabela para autorizações pendentes
CREATE TABLE IF NOT EXISTS event_revenue_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES event_registrations(id) ON DELETE CASCADE,
  event_id uuid REFERENCES ministry_events(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  member_id uuid REFERENCES members(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'rejected')),
  authorized_by uuid REFERENCES auth.users(id),
  authorized_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 4. RPC para registrar receita de evento
CREATE OR REPLACE FUNCTION register_event_revenue(p_registration_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS uuid AS $$
DECLARE
  v_registration record;
  v_event record;
  v_transaction_id uuid;
  v_category_id uuid;
BEGIN
  -- Buscar dados da inscrição
  SELECT * INTO v_registration
  FROM event_registrations
  WHERE id = p_registration_id;

  -- Buscar dados do evento
  IF v_registration.event_id IS NOT NULL THEN
    SELECT * INTO v_event
    FROM ministry_events
    WHERE id = v_registration.event_id;
  END IF;

  IF v_registration IS NULL THEN
    RAISE EXCEPTION 'Inscricao nao encontrada';
  END IF;

  IF v_registration.payment_status != 'paid' THEN
    RAISE EXCEPTION 'Inscricao nao paga';
  END IF;

  IF v_registration.finance_registered THEN
    RAISE EXCEPTION 'Receita ja registrada';
  END IF;

  -- Buscar categoria de evento
  SELECT id INTO v_category_id 
  FROM categories 
  WHERE church_id = v_registration.church_id 
    AND type = 'receita' 
    AND name ILIKE '%evento%' 
  LIMIT 1;

  -- Se não encontrou categoria de evento, buscar qualquer categoria de receita
  IF v_category_id IS NULL THEN
    SELECT id INTO v_category_id 
    FROM categories 
    WHERE church_id = v_registration.church_id 
      AND type = 'receita' 
    LIMIT 1;
  END IF;

  -- Criar transação de receita
  INSERT INTO transactions (
    church_id, description, type, amount, status,
    due_date, payment_date, origin, category_id,
    member_id, created_by
  ) VALUES (
    v_registration.church_id,
    'Receita de evento: ' || COALESCE(v_event.title, 'Evento'),
    'Receita',
    v_registration.payment_amount,
    'Pago',
    CURRENT_DATE,
    CURRENT_DATE,
    'Evento',
    v_category_id,
    v_registration.member_id,
    COALESCE(p_user_id, v_registration.checked_in_by)
  ) RETURNING id INTO v_transaction_id;

  -- Marcar como registrado no financeiro
  UPDATE event_registrations 
  SET finance_registered = true, 
      finance_registered_by = COALESCE(p_user_id, auth.uid()),
      finance_registered_at = now()
  WHERE id = p_registration_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS para nova tabela
ALTER TABLE event_revenue_authorizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manage_event_revenue_authorizations" ON event_revenue_authorizations;

CREATE POLICY "manage_event_revenue_authorizations" ON event_revenue_authorizations 
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND church_id = church_id)
);

-- 6. Indices para performance
CREATE INDEX IF NOT EXISTS idx_event_revenue_auth_status ON event_revenue_authorizations(status);
CREATE INDEX IF NOT EXISTS idx_event_revenue_auth_church ON event_revenue_authorizations(church_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_finance_registered ON event_registrations(finance_registered);

-- 7. Tabela de emails pendentes (para integração com Resend)
CREATE TABLE IF NOT EXISTS pending_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  template text NOT NULL,
  payload jsonb DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pending_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_pending_emails" ON pending_emails 
FOR ALL TO authenticated USING (true);

-- 8. Adicionar campo enable_waitlist em ministry_events
ALTER TABLE ministry_events 
ADD COLUMN IF NOT EXISTS enable_waitlist boolean DEFAULT false;

-- 9. Criar tabela de lista de espera de eventos
CREATE TABLE IF NOT EXISTS event_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  event_id uuid REFERENCES ministry_events(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES event_registrations(id) ON DELETE SET NULL,
  attendee_name text NOT NULL,
  attendee_email text,
  attendee_phone text,
  position integer DEFAULT 1,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'converted', 'cancelled')),
  added_at timestamptz DEFAULT now(),
  converted_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_event_waitlist" ON event_waitlist 
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND church_id = church_id)
);

CREATE INDEX IF NOT EXISTS idx_event_waitlist_event ON event_waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_event_waitlist_status ON event_waitlist(status);

-- 10. Tabela de lembretes de eventos
CREATE TABLE IF NOT EXISTS event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  event_id uuid REFERENCES ministry_events(id) ON DELETE CASCADE,
  reminder_date timestamptz NOT NULL,
  message text,
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage_event_reminders" ON event_reminders 
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND church_id = church_id)
);

CREATE INDEX IF NOT EXISTS idx_event_reminders_event ON event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_date ON event_reminders(reminder_date);

-- 11. Adicionar coluna parent_event_id para série de eventos recorrentes
ALTER TABLE ministry_events 
ADD COLUMN IF NOT EXISTS parent_event_id uuid REFERENCES ministry_events(id);

-- 12. Índices para recorrência
CREATE INDEX IF NOT EXISTS idx_events_parent ON ministry_events(parent_event_id);