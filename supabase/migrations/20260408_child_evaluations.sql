-- Migration: 20260408_child_evaluations.sql
-- Description: Create child_evaluations table for gamification and behavior tracking

-- Table for child evaluations (gamification)
CREATE TABLE IF NOT EXISTS child_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  check_in_id UUID REFERENCES child_check_ins(id) ON DELETE SET NULL,
  behavior_score INT CHECK (behavior_score BETWEEN 1 AND 5),
  participation_score INT CHECK (participation_score BETWEEN 1 AND 5),
  interaction_score INT CHECK (interaction_score BETWEEN 1 AND 5),
  notes TEXT,
  points_earned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for child_evaluations
ALTER TABLE child_evaluations ENABLE ROW LEVEL SECURITY;

-- Teachers/Admins can insert
DROP POLICY IF EXISTS "Teachers and admins can insert evaluations" ON child_evaluations;
CREATE POLICY "Teachers and admins can insert evaluations" ON child_evaluations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND church_id = child_evaluations.church_id
    )
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'lider', 'pastor')
    )
  );

-- Parents can view evaluations for their children
DROP POLICY IF EXISTS "Parents can view evaluations for their children" ON child_evaluations;
CREATE POLICY "Parents can view evaluations for their children" ON child_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM child_guardians cg
      JOIN guardians g ON g.id = cg.guardian_id
      WHERE cg.child_id = child_evaluations.child_id
      AND g.profile_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND church_id = child_evaluations.church_id
    )
  );

-- Trigger to calculate points based on scores
CREATE OR REPLACE FUNCTION calculate_evaluation_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple logic: sum of scores * 2
  NEW.points_earned := (COALESCE(NEW.behavior_score, 0) + COALESCE(NEW.participation_score, 0) + COALESCE(NEW.interaction_score, 0)) * 2;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_calculate_points ON child_evaluations;
CREATE TRIGGER tr_calculate_points
  BEFORE INSERT OR UPDATE ON child_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_evaluation_points();
