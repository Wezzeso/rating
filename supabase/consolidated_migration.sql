-- ==========================================================================
-- CONSOLIDATED SECURITY MIGRATION — Teacher Rating
-- ==========================================================================
-- This is the AUTHORITATIVE migration. Run this in Supabase SQL Editor.
-- It creates the correct schema from scratch or fixes an existing one.
-- Date: 2026-02-17
-- ==========================================================================

-- =====================
-- 1. EXTENSIONS
-- =====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- 2. TABLES (idempotent — won't fail if they already exist)
-- =====================
CREATE TABLE IF NOT EXISTS public.professors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  department text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id uuid NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
  user_fingerprint text NOT NULL,
  teaching integer CHECK (teaching IS NULL OR (teaching >= 1 AND teaching <= 5)),
  proctoring integer CHECK (proctoring IS NULL OR (proctoring >= 1 AND proctoring <= 5)),
  UNIQUE(professor_id, user_fingerprint)
);

-- Make rating columns nullable (for partial ratings)
ALTER TABLE public.ratings ALTER COLUMN teaching DROP NOT NULL;
ALTER TABLE public.ratings ALTER COLUMN proctoring DROP NOT NULL;

-- =====================
-- 3. ENABLE RLS
-- =====================
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- =====================
-- 4. PROFESSORS — RLS POLICIES
-- =====================

-- Drop ALL old policies to start clean
DROP POLICY IF EXISTS "Enable read access for approved professors" ON public.professors;
DROP POLICY IF EXISTS "Enable read access for admins" ON public.professors;
DROP POLICY IF EXISTS "Enable insert for everyone (suggestions)" ON public.professors;
DROP POLICY IF EXISTS "Enable insert for suggestions (force unapproved)" ON public.professors;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.professors;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.professors;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.professors;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.professors;

-- 4a. Public can read ONLY approved professors
CREATE POLICY "professors_select_approved"
ON public.professors FOR SELECT
USING (is_approved = true);

-- 4b. Authenticated users (admins) can read ALL professors (including unapproved)
CREATE POLICY "professors_select_authenticated"
ON public.professors FOR SELECT
TO authenticated
USING (true);

-- 4c. Anyone can insert a suggestion, but is_approved MUST be false
--     (Server actions also enforce this, but this is defense-in-depth)
CREATE POLICY "professors_insert_unapproved_only"
ON public.professors FOR INSERT
WITH CHECK (is_approved = false);

-- 4d. ONLY the service role can UPDATE professors (approve/reject)
--     All updates go through Server Actions using the service role key,
--     which bypasses RLS. No anon or authenticated user can update directly.
--     (No UPDATE policy = no one can update via the client API)

-- 4e. ONLY the service role can DELETE professors
--     Same reasoning as above — all deletes go through Server Actions.
--     (No DELETE policy = no one can delete via the client API)

-- =====================
-- 5. RATINGS — RLS POLICIES
-- =====================

DROP POLICY IF EXISTS "Enable read access for all" ON public.ratings;
DROP POLICY IF EXISTS "Enable insert for all" ON public.ratings;
DROP POLICY IF EXISTS "Enable full read access for authenticated" ON public.ratings;
DROP POLICY IF EXISTS "ratings_select_authenticated" ON public.ratings;

-- 5a. Authenticated users (admins) can read full rating data
CREATE POLICY "ratings_select_authenticated"
ON public.ratings FOR SELECT
TO authenticated
USING (true);

-- 5b. No direct INSERT for anon/authenticated — all inserts go through
--     Server Actions using the service role key (bypasses RLS).
--     This prevents anyone from inserting ratings directly via the client API.

-- =====================
-- 6. PUBLIC VIEW (hides user_fingerprint)
-- =====================
CREATE OR REPLACE VIEW public.ratings_public AS
SELECT id, professor_id, teaching, proctoring
FROM public.ratings;

-- =====================
-- 7. RPC FUNCTION (with SECURITY DEFINER + search_path)
-- =====================
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
SECURITY DEFINER
SET search_path = public  -- Prevents search_path injection attacks
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
