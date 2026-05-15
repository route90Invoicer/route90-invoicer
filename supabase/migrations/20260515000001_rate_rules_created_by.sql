-- Add created_by to rate_rules for user ownership tracking.
-- Also force-disables RLS (auth enforced at the application layer).
-- Run in Supabase SQL Editor if the dashboard re-enabled RLS.

ALTER TABLE rate_rules
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Drop every policy that may exist then disable RLS
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'rate_rules' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON rate_rules', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE rate_rules DISABLE ROW LEVEL SECURITY;
