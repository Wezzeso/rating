-- 1. Add tags column to ratings table (max 3 tags per rating)
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS tags text[];

-- Ensure tags array is not larger than 3 and contains only specified tags if needed.
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS max_tags_check;
ALTER TABLE public.ratings ADD CONSTRAINT max_tags_check CHECK (array_length(tags, 1) <= 3);

-- 2. Update public view
DROP VIEW IF EXISTS public.ratings_public;
CREATE VIEW public.ratings_public AS
SELECT id, professor_id, teaching, proctoring, tags
FROM public.ratings;

-- 3. Recreate RPC function
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
