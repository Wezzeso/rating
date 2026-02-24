-- ==============================================================================
-- BATCH MERGE PROFESSORS (ADDITIONAL DUPLICATES)
-- ==============================================================================
-- This script safely merges three specific duplicate pairs.
--
-- Make sure the `merge_professors` function exists (from supabase/merge_professors.sql)
-- before running this script.
-- ==============================================================================

DO $$ 
DECLARE
    prim_id UUID;
    dup_id UUID;
    pair RECORD;
BEGIN
    FOR pair IN 
        SELECT * FROM (VALUES
            -- 1. Probable Duplicate (Truncated Surname):
            -- "Tule" is likely a data entry truncation of "Toleubek".
            ('Moldir Toleubek', 'Moldir Tule'),

            -- 2. Potential Duplicate (Typos/Spelling Variant):
            -- "Asset" (male) and "Assel" (female), 1-letter typo with matching surname.
            ('Assel Alimzhan', 'Asset Alimzhan'),

            -- 3. Potential Duplicate (Name Variant):
            -- Both have same names but swapped format / slight expansion ("Nurlybek" vs "Nurbek").
            ('Nurlybek Shayakhmetov', 'Shayakhmetov Nurbek')
            
    ) AS s(primary_name, duplicate_name)
    LOOP
        -- Find primary ID by name (case insensitive)
        SELECT id INTO prim_id FROM public.professors WHERE name ILIKE pair.primary_name LIMIT 1;
        
        -- Find duplicate ID by name (case insensitive)
        SELECT id INTO dup_id FROM public.professors WHERE name ILIKE pair.duplicate_name LIMIT 1;
        
        -- If both exist in the DB and are different records, merge them
        IF prim_id IS NOT NULL AND dup_id IS NOT NULL AND prim_id != dup_id THEN
            PERFORM merge_professors(prim_id, dup_id);
            RAISE NOTICE 'SUCCESS: Merged "%" into "%"', pair.duplicate_name, pair.primary_name;
        ELSE
            IF prim_id IS NULL THEN
                RAISE NOTICE 'SKIPPED: Could not find PRIMARY "%"', pair.primary_name;
            ELSIF dup_id IS NULL THEN
                RAISE NOTICE 'SKIPPED: Could not find DUPLICATE "%"', pair.duplicate_name;
            ELSE
                RAISE NOTICE 'SKIPPED: Primary and Duplicate are the same record ("%")!', pair.primary_name;
            END IF;
        END IF;
        
        -- Reset variables for next loop
        prim_id := NULL;
        dup_id := NULL;
    END LOOP;

END $$;
