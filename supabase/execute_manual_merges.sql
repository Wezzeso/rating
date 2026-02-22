-- ==============================================================================
-- BATCH MERGE PROFESSORS
-- ==============================================================================
-- This script automatically looks up the IDs for the exact name pairs you found
-- and runs the `merge_professors` function on them.
-- 
-- Make sure you have already run `supabase/merge_professors.sql` to create
-- the function before running this script!
-- ==============================================================================

DO $$ 
DECLARE
    prim_id UUID;
    dup_id UUID;
    pair RECORD;
BEGIN
    FOR pair IN 
        SELECT * FROM (VALUES
            -- 1. Swapped Names
            ('Aitolkyn Sagynbayeva', 'Sagynbayeva Aitolkyn'),
            ('Alimzhan Yessenov', 'Yessenov Alimzhan'),
            ('Alisher Amirov', 'Amirov Alisher'),
            ('Dana Tolegen', 'Tolegen Dana'),
            ('Gulsim Tulepova', 'Tulepova Gulsim'),
            ('Inkar Jubatchanova', 'Jubatchanova Inkar'),
            ('Kamila Zhakupova', 'Zhakupova Kamila'),
            ('Laura Nurtazina', 'Nurtazina Laura'),
            ('Moldir Toleubek', 'Toleubek Moldir'),
            ('Zamart Ramazanova', 'Ramazanova Zamart'),
            
            -- 2. Typos & Spelling variations
            ('Akhmetbekova Assel', 'Akhmetbekova Asel'),
            ('Yelemes Tolkynay', 'Elemes Tolkynay'),
            ('Assem Kusmanova', 'Kusmanova Asem'),
            ('Madi Kanagat', 'Madi Kaganat'),
            ('Maiya Abzhaparova', 'Maiya Abzharapova'),
            ('Ormanova Assel', 'Omanova Assel')
    ) AS s(primary_name, duplicate_name)
    LOOP
        -- Find primary ID by name (case insensitive)
        SELECT id INTO prim_id FROM public.professors WHERE name ILIKE pair.primary_name LIMIT 1;
        
        -- Find duplicate ID by name (case insensitive)
        SELECT id INTO dup_id FROM public.professors WHERE name ILIKE pair.duplicate_name LIMIT 1;
        
        -- If both exist in your DB and are different records, merge them
        IF prim_id IS NOT NULL AND dup_id IS NOT NULL AND prim_id != dup_id THEN
            PERFORM merge_professors(prim_id, dup_id);
            RAISE NOTICE 'SUCCESS: Merged "%" into "%"', pair.duplicate_name, pair.primary_name;
        ELSE
            RAISE NOTICE 'SKIPPED: Could not find both "%" and "%"', pair.primary_name, pair.duplicate_name;
        END IF;
        
        -- Reset variables for next loop
        prim_id := NULL;
        dup_id := NULL;
    END LOOP;

    -- 3. Delete combined garbage entry
    -- (Since Rassul and Akerke both exist individually, we can safely delete the accidental combined entry entirely)
    DELETE FROM public.professors WHERE name ILIKE 'Rassul Akhmetbekov Merzetkhan Akerke';
    RAISE NOTICE 'SUCCESS: Deleted combined entry "Rassul Akhmetbekov Merzetkhan Akerke"';
    
END $$;
