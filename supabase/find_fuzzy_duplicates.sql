-- ==============================================================================
-- FUZZY DUPLICATE DETECTION FOR PROFESSORS
-- This script finds professors with very similar names (e.g. 1-2 typos apart)
-- 
-- Requirements: 
-- You must have the `fuzzystrmatch` or `pg_trgm` extensions enabled in Supabase.
-- (Supabase enables pg_trgm by default in most projects, but we'll enable it to be safe).
-- ==============================================================================

-- 1. Enable the required extension for Levenshtein distance (calculates how many edits it takes to change string A to string B)
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- 2. Enable Trigram matching for similarity scores (optional, but good to have)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==============================================================================
-- QUERY 1: Find all pairs of professors whose names are 1 or 2 characters different
-- (Using Levenshtein distance)
-- ==============================================================================
SELECT 
    p1.id AS id_1,
    p1.name AS name_1,
    p1.is_approved AS approved_1,
    p2.id AS id_2,
    p2.name AS name_2,
    p2.is_approved AS approved_2,
    levenshtein(LOWER(p1.name), LOWER(p2.name)) AS typos_count
FROM 
    public.professors p1
JOIN 
    public.professors p2 
    ON p1.id > p2.id -- Prevents checking the same pair twice and prevents matching a row against itself
WHERE 
    levenshtein(LOWER(p1.name), LOWER(p2.name)) BETWEEN 1 AND 2
ORDER BY 
    typos_count ASC, 
    p1.name;

-- ==============================================================================
-- QUERY 2: Find pairs using Trigram similarity (alternative approach)
-- This finds names that are at least 80% similar, ignoring case.
-- Useful for catching swapped words like "Aidana Zhalgas" vs "Zhalgas Aidana".
-- ==============================================================================
SELECT 
    p1.id AS id_1,
    p1.name AS name_1,
    p1.is_approved AS approved_1,
    p2.id AS id_2,
    p2.name AS name_2,
    p2.is_approved AS approved_2,
    similarity(p1.name, p2.name) AS similarity_score
FROM 
    public.professors p1
JOIN 
    public.professors p2 
    ON p1.id > p2.id
WHERE 
    similarity(p1.name, p2.name) > 0.8
ORDER BY 
    similarity_score DESC;

-- ==============================================================================
-- HOW TO USE THIS LIST TO CLEAN UP:
-- ==============================================================================
-- Depending on what you find, you can manually delete the incorrect ones:
-- 
-- DELETE FROM public.professors WHERE id = 'the-id-of-the-typo-one';
-- 
-- DO NOT auto-delete based on fuzzy search alone, because "John Smith" and "Jane Smith" 
-- might trigger a fuzzy match but are actually different people. Always review manually.
