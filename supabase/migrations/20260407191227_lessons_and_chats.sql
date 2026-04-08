-- ==========================================
-- Migration: Preparação de Aula e Chat
-- ==========================================

-- 1. Criação do Bucket de Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lesson_materials', 'lesson_materials', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Lições (Vinculada à tabela de escalas do staff)
CREATE TABLE IF NOT EXISTS public.classroom_lessons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    staff_schedule_id uuid NOT NULL REFERENCES public.staff_schedules(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    external_link text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(staff_schedule_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_lessons_church ON public.classroom_lessons(church_id);
CREATE INDEX IF NOT EXISTS idx_classroom_lessons_schedule ON public.classroom_lessons(staff_schedule_id);

-- 3. Tabela de Materiais (Arquivos)
CREATE TABLE IF NOT EXISTS public.lesson_materials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    lesson_id uuid NOT NULL REFERENCES public.classroom_lessons(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text,
    size_bytes bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson ON public.lesson_materials(lesson_id);

-- 4. Tabela de Chats da Escala
CREATE TABLE IF NOT EXISTS public.schedule_chats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
    schedule_id uuid NOT NULL REFERENCES public.volunteer_schedules(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message text NOT NULL,
    is_leader boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedule_chats_schedule ON public.schedule_chats(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_chats_created ON public.schedule_chats(created_at DESC);

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE public.classroom_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_chats ENABLE ROW LEVEL SECURITY;

-- Políticas Básicas (Isolamento por Igreja e Auth)

-- Classroom Lessons
CREATE POLICY "Users can view lessons of their church" 
ON public.classroom_lessons FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.church_id = classroom_lessons.church_id));

CREATE POLICY "Users can manage lessons of their church"
ON public.classroom_lessons FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.church_id = classroom_lessons.church_id));

-- Lesson Materials
CREATE POLICY "Users can view materials of their church" 
ON public.lesson_materials FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.church_id = lesson_materials.church_id));

CREATE POLICY "Users can manage materials of their church"
ON public.lesson_materials FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.church_id = lesson_materials.church_id));

-- Schedule Chats
CREATE POLICY "Users can view chats of their church" 
ON public.schedule_chats FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.church_id = schedule_chats.church_id));

CREATE POLICY "Users can manage chats of their church"
ON public.schedule_chats FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.church_id = schedule_chats.church_id));

-- Storage Policies (Lesson Materials Bucket)
CREATE POLICY "Public View Lesson Materials" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'lesson_materials');

CREATE POLICY "Authenticated Insert Lesson Materials" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'lesson_materials' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete Lesson Materials" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'lesson_materials' AND auth.role() = 'authenticated');
