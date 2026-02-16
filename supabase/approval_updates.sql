-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX THE SCHEMA

-- 1. Rename columns (COMMENTED OUT because you likely already did this successfully)
-- If you haven't renamed them yet, uncomment the next two lines:
-- ALTER TABLE public.ratings RENAME COLUMN teaching_score TO teaching;
-- ALTER TABLE public.ratings RENAME COLUMN proctoring_score TO proctoring;

-- 2. Allow Admins to see unapproved professors
DROP POLICY IF EXISTS "Enable read access for admins" ON public.professors;
CREATE POLICY "Enable read access for admins"
ON public.professors FOR SELECT
TO authenticated
USING (true);

-- 3. Allow Admins to Delete professors
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.professors;
CREATE POLICY "Enable delete for admins only"
ON public.professors FOR DELETE
TO authenticated
USING (true);

-- 4. Update the RPC function to return correct column names
-- DROP is required to handle return type changes
DROP FUNCTION IF EXISTS get_professors_with_ratings();

CREATE OR REPLACE FUNCTION get_professors_with_ratings()
RETURNS TABLE (
  id uuid,
  name text,
  department text,
  is_approved boolean,
  created_at timestamptz,
  teaching_rating numeric,
  proctoring_rating numeric
)
LANGUAGE sql
AS $$
  SELECT
    p.id,
    p.name,
    p.department,
    p.is_approved,
    p.created_at,
    round(avg(r.teaching), 1) as teaching_rating,
    round(avg(r.proctoring), 1) as proctoring_rating
  FROM
    public.professors p
  LEFT JOIN
    public.ratings r ON p.id = r.professor_id
  WHERE
    p.is_approved = true
  GROUP BY
    p.id;
$$;
