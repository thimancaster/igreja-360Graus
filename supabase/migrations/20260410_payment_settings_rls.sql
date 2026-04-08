-- ==========================================
-- Migration: Payment Settings Configuration
-- ==========================================

-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Payment settings is already created in previous migration
-- Let's add RLS policies if not exists
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active payment settings" ON public.payment_settings;
CREATE POLICY "Anyone can view active payment settings" ON public.payment_settings 
FOR SELECT TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage payment settings" ON public.payment_settings;
CREATE POLICY "Admins can manage payment settings" ON public.payment_settings 
FOR ALL TO authenticated
USING (church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid()));

-- Enable RLS on payment_webhooks
ALTER TABLE public.payment_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view processed webhooks" ON public.payment_webhooks;
CREATE POLICY "Anyone can view processed webhooks" ON public.payment_webhooks 
FOR SELECT TO authenticated
USING (processed = true);

-- Create function to get payment instructions
CREATE OR REPLACE FUNCTION public.get_payment_instructions(p_church_id uuid, p_gateway text DEFAULT 'pix')
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_instructions text;
  v_church record;
BEGIN
  -- First try payment_settings
  SELECT payment_instructions INTO v_instructions
  FROM public.payment_settings
  WHERE church_id = p_church_id 
    AND gateway = p_gateway::payment_gateway 
    AND is_active = true;
  
  IF v_instructions IS NOT NULL THEN
    RETURN v_instructions;
  END IF;
  
  -- Fallback to church pix data
  SELECT * INTO v_church
  FROM public.churches
  WHERE id = p_church_id;
  
  IF v_church IS NOT NULL THEN
    RETURN concat(
      'Pagamento via ', upper(p_gateway), '. ',
      CASE 
        WHEN v_church.pix_key IS NOT NULL THEN concat('Chave PIX: ', v_church.pix_key)
        WHEN v_church.bank_name IS NOT NULL THEN concat('Banco: ', v_church.bank_name, ' - Agência: ', v_church.bank_agency, ' - Conta: ', v_church.bank_account)
        ELSE ''
      END
    );
  END IF;
  
  RETURN 'Pagamento via PIX. Entre em contato com a igreja.';
END;
$$;
