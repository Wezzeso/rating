-- ==============================================================================
-- MERGE PROFESSORS FUNCTION
-- ==============================================================================
-- This function allows you to safely merge a duplicate professor into a primary one.
-- It moves all ratings from the "duplicate" to the "primary" professor and then 
-- deletes the duplicate professor.
-- 
-- Usage: 
-- SELECT merge_professors('target_primary_id', 'source_duplicate_id');
-- ==============================================================================

CREATE OR REPLACE FUNCTION merge_professors(
    primary_id UUID,
    duplicate_id UUID
) 
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Ensures this runs with necessary permissions to bypass RLS if needed internally
AS $$
BEGIN
    -- 1. Verify both professors exist
    IF NOT EXISTS (SELECT 1 FROM public.professors WHERE id = primary_id) THEN
        RAISE EXCEPTION 'Primary professor (ID: %) does not exist.', primary_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.professors WHERE id = duplicate_id) THEN
        RAISE EXCEPTION 'Duplicate professor (ID: %) does not exist.', duplicate_id;
    END IF;

    -- 2. Prevent merging a professor into themselves
    IF primary_id = duplicate_id THEN
        RAISE EXCEPTION 'Cannot merge a professor into themselves.';
    END IF;

    -- 3. Move ratings from duplicate to primary.
    -- If a user (fingerprint) has rated BOTH professors, we will hit a unique constraint 
    -- violation when trying to change the duplicate's rating over to the primary.
    -- To handle this cleanly: we will DELETE the duplicate's rating if the primary already 
    -- has a rating from that same user_fingerprint.
    DELETE FROM public.ratings r_dup
    WHERE r_dup.professor_id = duplicate_id
      AND EXISTS (
          SELECT 1 
          FROM public.ratings r_prim
          WHERE r_prim.professor_id = primary_id 
            AND r_prim.user_fingerprint = r_dup.user_fingerprint
      );

    -- Now safely update the remaining ratings to belong to the primary professor
    UPDATE public.ratings
    SET professor_id = primary_id
    WHERE professor_id = duplicate_id;

    -- 4. Delete the duplicate professor
    DELETE FROM public.professors
    WHERE id = duplicate_id;

END;
$$;
