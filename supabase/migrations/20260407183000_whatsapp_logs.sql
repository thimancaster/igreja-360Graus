-- Migração da Fase 3: Integração com Evolution API (WhatsApp)

-- 1. Coluna rastreadora na tabela base de escalas
ALTER TABLE public.volunteer_schedules 
ADD COLUMN IF NOT EXISTS whatsapp_reminder_sent boolean DEFAULT false;

-- 2. Tabela de logs do Evolution API
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id uuid REFERENCES public.volunteer_schedules(id) ON DELETE SET NULL,
    status text NOT NULL,
    details text,
    created_at timestamptz DEFAULT now()
);

-- 3. Segurança RLS simples para os Logs
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Whatsapp logs are viewable by church admins"
    ON public.whatsapp_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'pastor')
        )
    );
