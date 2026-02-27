
-- Tighten update policy: only allow setting is_active to false (unsubscribe)
DROP POLICY "Anyone can unsubscribe by token" ON public.subscribers;
CREATE POLICY "Anyone can unsubscribe by token" ON public.subscribers
  FOR UPDATE USING (true)
  WITH CHECK (is_active = false);

-- Tighten insert policy: only allow inserting active subscribers with valid email
DROP POLICY "Anyone can subscribe" ON public.subscribers;
CREATE POLICY "Anyone can subscribe" ON public.subscribers
  FOR INSERT WITH CHECK (is_active = true AND email ~ '^[^@]+@[^@]+\.[^@]+$');
