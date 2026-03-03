-- ==========================================================================
-- FINAL INITIALIZATION SCHEMA
-- ==========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.professors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  department text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  aitu_verified boolean DEFAULT NULL,
  is_duplicate boolean DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  professor_id uuid NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
  user_fingerprint text NOT NULL,
  teaching integer CHECK (teaching IS NULL OR (teaching >= 1 AND teaching <= 5)),
  proctoring integer CHECK (proctoring IS NULL OR (proctoring >= 1 AND proctoring <= 5)),
  tags text[],
  UNIQUE(professor_id, user_fingerprint)
);

-- Ensure tags array is not larger than 3
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS max_tags_check;
ALTER TABLE public.ratings ADD CONSTRAINT max_tags_check CHECK (array_length(tags, 1) <= 3);

-- 3. ENABLE RLS
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- 4. PROFESSORS — RLS POLICIES
DROP POLICY IF EXISTS "Enable read access for approved professors" ON public.professors;
DROP POLICY IF EXISTS "Enable read access for admins" ON public.professors;
DROP POLICY IF EXISTS "Enable insert for everyone (suggestions)" ON public.professors;
DROP POLICY IF EXISTS "Enable insert for suggestions (force unapproved)" ON public.professors;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.professors;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.professors;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.professors;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.professors;
DROP POLICY IF EXISTS "professors_select_approved" ON public.professors;
DROP POLICY IF EXISTS "professors_select_authenticated" ON public.professors;
DROP POLICY IF EXISTS "professors_insert_unapproved_only" ON public.professors;

CREATE POLICY "professors_select_approved"
ON public.professors FOR SELECT
USING (is_approved = true);

CREATE POLICY "professors_select_authenticated"
ON public.professors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "professors_insert_unapproved_only"
ON public.professors FOR INSERT
WITH CHECK (is_approved = false);

-- 5. RATINGS — RLS POLICIES
DROP POLICY IF EXISTS "Enable read access for all" ON public.ratings;
DROP POLICY IF EXISTS "Enable insert for all" ON public.ratings;
DROP POLICY IF EXISTS "Enable full read access for authenticated" ON public.ratings;
DROP POLICY IF EXISTS "ratings_select_authenticated" ON public.ratings;

CREATE POLICY "ratings_select_authenticated"
ON public.ratings FOR SELECT
TO authenticated
USING (true);

-- 6. PUBLIC VIEW (hides user_fingerprint)
DROP VIEW IF EXISTS public.ratings_public;

CREATE VIEW public.ratings_public AS
SELECT id, professor_id, teaching, proctoring, tags
FROM public.ratings;

-- 7. RPC FUNCTION (with SECURITY DEFINER + search_path)
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
  proctoring_count bigint,
  top_tags text[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
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
    count(r.proctoring) as proctoring_count,
    ARRAY(
      SELECT tag
      FROM public.ratings r2, unnest(r2.tags) as tag
      WHERE r2.professor_id = p.id
      GROUP BY tag
      ORDER BY count(*) DESC
      LIMIT 3
    ) as top_tags
  FROM
    public.professors p
  LEFT JOIN
    public.ratings r ON p.id = r.professor_id
  WHERE
    p.is_approved = true
  GROUP BY
    p.id;
$$;
