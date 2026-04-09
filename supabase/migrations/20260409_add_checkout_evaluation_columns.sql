-- Migration: 20260409_add_checkout_evaluation_columns.sql
-- Description: Add missing evaluation columns to child_check_ins table for gamification during checkout

-- Add columns to child_check_ins
ALTER TABLE public.child_check_ins 
ADD COLUMN IF NOT EXISTS behavior_score integer CHECK (behavior_score BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS participation_score integer CHECK (participation_score BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS interaction_score integer CHECK (interaction_score BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS session_notes text;

-- Add comment for documentation
COMMENT ON COLUMN public.child_check_ins.behavior_score IS 'Avaliação de comportamento na saída';
COMMENT ON COLUMN public.child_check_ins.participation_score IS 'Avaliação de participação na saída';
COMMENT ON COLUMN public.child_check_ins.interaction_score IS 'Avaliação de interação na saída';
COMMENT ON COLUMN public.child_check_ins.session_notes IS 'Notas e observações do professor registradas no checkout';
