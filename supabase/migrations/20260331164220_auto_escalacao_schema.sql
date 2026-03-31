-- 1. Permitir que volunteer_id seja nulo (vagas abertas na escala)
ALTER TABLE public.volunteer_schedules ALTER COLUMN volunteer_id DROP NOT NULL;

-- 2. Adicionar prazo de expiração para "Auto Escala" e "Convocação"
ALTER TABLE public.volunteer_schedules ADD COLUMN accept_until timestamptz;

-- 3. Remover a política abrangente e insegura anterior
DROP POLICY IF EXISTS "manage_volunteer_schedules" ON public.volunteer_schedules;

-- 4. Criar Políticas Restritivas de Leitura (Membros só leem o próprio departamento, líderes leem tudo)
CREATE POLICY "view_volunteer_schedules" ON public.volunteer_schedules
  FOR SELECT TO authenticated
  USING (
    church_id = get_user_church_id() AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'pastor') OR
      has_role(auth.uid(), 'lider') OR
      EXISTS (
        SELECT 1 FROM public.department_volunteers dv 
        WHERE dv.profile_id = auth.uid() 
          AND dv.ministry_id = volunteer_schedules.ministry_id 
          AND dv.is_active = true
      )
    )
  );

-- 5. Criar Políticas Restritivas de Update (Membros só atualizam se for pra se escalar ou confirmar, líderes podem tudo)
CREATE POLICY "update_volunteer_schedules" ON public.volunteer_schedules
  FOR UPDATE TO authenticated
  USING (
    church_id = get_user_church_id() AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pastor') OR has_role(auth.uid(), 'lider') OR
      -- Se a escala já é do cara
      EXISTS (
        SELECT 1 FROM public.department_volunteers dv 
        WHERE dv.id = volunteer_schedules.volunteer_id AND dv.profile_id = auth.uid()
      ) OR
      -- Ou se a escala está aberta E dentro do prazo limitador
      (volunteer_schedules.volunteer_id IS NULL AND (volunteer_schedules.accept_until IS NULL OR volunteer_schedules.accept_until > now()))
    )
  )
  WITH CHECK (
    church_id = get_user_church_id() AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pastor') OR has_role(auth.uid(), 'lider') OR
      -- Após o update, a escala TEM que estar com o UUID dele (ele não pode designar outro membro)
      EXISTS (
        SELECT 1 FROM public.department_volunteers dv 
        WHERE dv.id = volunteer_id AND dv.profile_id = auth.uid()
      )
    )
  );

-- 6. Políticas de Create e Delete apenas para a gestão
CREATE POLICY "insert_volunteer_schedules" ON public.volunteer_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id() AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pastor') OR has_role(auth.uid(), 'lider')
    )
  );
  
CREATE POLICY "delete_volunteer_schedules" ON public.volunteer_schedules
  FOR DELETE TO authenticated
  USING (
    church_id = get_user_church_id() AND (
      has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'pastor') OR has_role(auth.uid(), 'lider')
    )
  );

-- 7. Função de Auto-Redesignação (Sistema transfere ou converte em vaga aberta se expirar)
CREATE OR REPLACE FUNCTION public.reassign_expired_schedules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sched RECORD;
  new_vol_id UUID;
BEGIN
  -- Buscar escalas não nulas (convocações diretas) que não confirmaram e o prazo expirou
  FOR sched IN 
    SELECT * FROM public.volunteer_schedules 
    WHERE accept_until < now() 
      AND confirmed = false 
      AND volunteer_id IS NOT NULL 
  LOOP
    -- Acha um cara aleatório, do mesmo ministério, ativo, diferente do atual liderado livre (sem conflitos de escala nessa data/hora)
    SELECT dv.id INTO new_vol_id
    FROM public.department_volunteers dv
    WHERE dv.ministry_id = sched.ministry_id
      AND dv.is_active = true
      AND dv.id != sched.volunteer_id
      AND NOT public.check_volunteer_conflict(dv.id, sched.schedule_date, sched.shift_start, sched.shift_end)
    ORDER BY random()
    LIMIT 1;
    
    IF new_vol_id IS NOT NULL THEN
      -- Designa para o novo "sorteado" dando a ele +48 horas para aceitar
      UPDATE public.volunteer_schedules 
      SET volunteer_id = new_vol_id,
          accept_until = now() + interval '2 days',
          confirmed = false,
          notes = CONCAT('Auto-desginado pelo sistema após expiração. ', COALESCE(notes, ''))
      WHERE id = sched.id;
    ELSE
      -- Ninguém estava livre? Transforma em "Vaga Aberta" na Mural!
      UPDATE public.volunteer_schedules 
      SET volunteer_id = NULL,
          accept_until = NULL,
          confirmed = false,
          notes = CONCAT('Disponibilizado na Mural pois todos estavam ocupados/expiraram. ', COALESCE(notes, ''))
      WHERE id = sched.id;
    END IF;
  END LOOP;
END;
$$;

-- 8. Tentar acoplar ao PG_CRON se ele existir no servidor
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Roda a cada 2 horas
    PERFORM cron.schedule('reassign_expired_schedules_job', '0 */2 * * *', 'SELECT public.reassign_expired_schedules()');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Fails gracefully se o usuário não tiver permissão para usar o schema cron
    NULL;
END;
$$;
