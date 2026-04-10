-- Migration: 20260409151000_add_behavior_points_to_children.sql
-- Description: Adds behavior_points column to children table for total points accumulation

ALTER TABLE public.children 
ADD COLUMN IF NOT EXISTS behavior_points integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.children.behavior_points IS 'Total acumulado de pontos de comportamento e participação';

-- Index for points-based queries
CREATE INDEX IF NOT EXISTS idx_children_behavior_points ON public.children(behavior_points);
