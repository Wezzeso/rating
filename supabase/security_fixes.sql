-- ==========================================================================
--  SECURITY FIXES — Run this in Supabase SQL Editor
--  Hardens RLS policies and updates the RPC function.
-- ==========================================================================

-- =========================================
-- 1. FIX: Force is_approved = false on INSERT
-- =========================================
-- Drop the old overly-permissive insert policy
DROP POLICY IF EXISTS "Enable insert for everyone (suggestions)" ON public.professors;

-- New policy: anyone can suggest, but is_approved MUST be false
CREATE POLICY "Enable insert for suggestions (force unapproved)"
ON public.professors FOR INSERT
WITH CHECK (is_approved = false);

-- =========================================
-- 2. FIX: Restrict professor UPDATE to authenticated users
-- =========================================
-- (Actual admin-email verification happens in the Server Action.
--  RLS here acts as a second layer of defense.)
DROP POLICY IF EXISTS "Enable update for admins only" ON public.professors;
CREATE POLICY "Enable update for authenticated users"
ON public.professors FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =========================================
-- 3. FIX: Restrict professor DELETE to authenticated users
-- =========================================
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.professors;
CREATE POLICY "Enable delete for authenticated users"
ON public.professors FOR DELETE
TO authenticated
USING (true);

-- =========================================
-- 4. FIX: Restrict ratings INSERT
-- =========================================
-- Remove the overly-permissive "anyone can insert" policy.
-- All rating inserts now go through Server Actions using the service role key.
DROP POLICY IF EXISTS "Enable insert for all" ON public.ratings;

-- =========================================
-- 5. FIX: Hide user_fingerprint from public ratings reads
-- =========================================
-- Drop the old "read everything" policy
DROP POLICY IF EXISTS "Enable read access for all" ON public.ratings;

-- Create a view that excludes user_fingerprint for public use
CREATE OR REPLACE VIEW public.ratings_public AS
SELECT id, professor_id, teaching, proctoring
FROM public.ratings;

-- Allow authenticated users (admins) to see all rating data including fingerprints
CREATE POLICY "Enable full read access for authenticated"
ON public.ratings FOR SELECT
TO authenticated
USING (true);

-- For the anon role, no direct table SELECT — they use the RPC function instead
-- (The RPC function returns aggregated data without fingerprints)

-- =========================================
-- 6. UPDATE RPC: Ensure it returns counts and no fingerprints
-- =========================================
DROP FUNCTION IF EXISTS get_professors_with_ratings();

CREATE OR REPLACE FUNCTION get_professors_with_ratings()
RETURNS TABLE (
  id uuid,
  name text,
  department text,
  is_approved boolean,
  created_at timestamptz,
  teaching_rating numeric,
  teaching_count bigint,
  proctoring_rating numeric,
  proctoring_count bigint
)
LANGUAGE sql
SECURITY DEFINER  -- Runs with the function owner's permissions (bypasses RLS)
AS $$
  SELECT
    p.id,
    p.name,
    p.department,
    p.is_approved,
    p.created_at,
    round(avg(r.teaching), 1) as teaching_rating,
    count(r.teaching) as teaching_count,
    round(avg(r.proctoring), 1) as proctoring_rating,
    count(r.proctoring) as proctoring_count
  FROM
    public.professors p
  LEFT JOIN
    public.ratings r ON p.id = r.professor_id
  WHERE
    p.is_approved = true
  GROUP BY
    p.id;
$$;
