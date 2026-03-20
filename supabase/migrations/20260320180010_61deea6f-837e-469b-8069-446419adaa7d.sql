
-- Fix notifications insert policy to restrict to same-church users only
DROP POLICY IF EXISTS "insert_notifications" ON notifications;

CREATE POLICY "insert_notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = notifications.user_id
    AND profiles.church_id = get_user_church_id()
  )
);
