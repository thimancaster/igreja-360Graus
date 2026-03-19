
CREATE POLICY "insert_notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);
