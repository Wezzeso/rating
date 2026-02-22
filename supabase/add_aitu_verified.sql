-- Add columns to cache verification results on professors table
-- NULL = not checked, TRUE/FALSE = check result
ALTER TABLE public.professors
ADD COLUMN IF NOT EXISTS aitu_verified boolean DEFAULT NULL;

ALTER TABLE public.professors
ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT NULL;
