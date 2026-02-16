-- 1. Make rating columns nullable to allow partial ratings
ALTER TABLE public.ratings ALTER COLUMN teaching DROP NOT NULL;
ALTER TABLE public.ratings ALTER COLUMN proctoring DROP NOT NULL;

-- 2. Drop the existing checks that enforce >= 1 (since they might fail on NULL if not careful, though check(null) is usually pass, but let's be safe and explicitly allow nulls or strict ranges)
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_teaching_check;
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_proctoring_check;
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_teaching_score_check; -- legacy name just in case
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_proctoring_score_check; -- legacy name just in case

-- 3. Add new constraints that allow NULL but enforce range if present
ALTER TABLE public.ratings ADD CONSTRAINT ratings_teaching_range CHECK (teaching IS NULL OR (teaching >= 1 AND teaching <= 5));
ALTER TABLE public.ratings ADD CONSTRAINT ratings_proctoring_range CHECK (proctoring IS NULL OR (proctoring >= 1 AND proctoring <= 5));

-- 4. Update RPC to return counts and handle partial data
DROP FUNCTION IF EXISTS get_professors_with_ratings();

CREATE OR REPLACE FUNCTION get_professors_with_ratings()
RETURNS TABLE (
  id uuid,
  name text,
  department text, -- Keeping this for now to avoid breaking other things, but will ignore in UI
  is_approved boolean,
  created_at timestamptz,
  teaching_rating numeric,
  teaching_count bigint,
  proctoring_rating numeric,
  proctoring_count bigint
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
