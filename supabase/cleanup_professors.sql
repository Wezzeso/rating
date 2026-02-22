-- 1. Auto-format all names (approved and pending) to clean up extra spaces and ensure basic Title Casing
UPDATE public.professors
SET name = INITCAP(TRIM(regexp_replace(name, '\s+', ' ', 'g')));

-- 2. Delete pending suggestions that have only one word (no surname)
DELETE FROM public.professors
WHERE is_approved = false
AND TRIM(name) NOT LIKE '% %';

-- 3. Delete pending suggestions that match an ALREADY approved professor (case-insensitive)
DELETE FROM public.professors p1
WHERE is_approved = false
AND EXISTS (
    SELECT 1 FROM public.professors p2
    WHERE p2.is_approved = true AND LOWER(TRIM(p1.name)) = LOWER(TRIM(p2.name))
);

-- 4. Delete duplicate pending suggestions (keep only the oldest one for each name)
DELETE FROM public.professors
WHERE is_approved = false
AND id IN (
    SELECT id
    FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at ASC) as row_num
        FROM public.professors
        WHERE is_approved = false
    ) t
    WHERE row_num > 1
);
