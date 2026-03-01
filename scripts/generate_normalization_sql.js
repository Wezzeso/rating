const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Basic Levenshtein distance calculation
function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

function tokenize(str) {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
}

function areWordsSwapped(str1, str2) {
    const words1 = tokenize(str1).sort().join(' ');
    const words2 = tokenize(str2).sort().join(' ');
    return words1 === words2 && words1.length > 0;
}

// Check if string A is strongly contained in string B
function isSubset(str1, str2) {
    const words1 = tokenize(str1);
    const words2 = tokenize(str2);
    // If str1 is just 1 word, it's very risky to auto-match "John" to "John Smith"
    // especially if there's multiple Johns. 
    // We only consider it a subset if it's >1 word or if there's only one possible match for that word.
    let matches = 0;
    for (const w of words1) {
        if (words2.includes(w)) matches++;
    }
    return matches === words1.length;
}

async function run() {
    console.log("Fetching professors from database...");
    const { data: dbProfessors, error } = await supabase.from('professors').select('id, name');

    if (error) {
        console.error("Error fetching professors:", error);
        return;
    }

    console.log(`Found ${dbProfessors.length} professors in DB.`);

    const officialData = JSON.parse(fs.readFileSync('teachers_data.json', 'utf8'));
    const officialNames = officialData.map(t => t.teacherName);
    console.log(`Found ${officialNames.length} official professors in JSON.`);

    // Map of official names for quick O(1) exact lookup
    const officialNameSet = new Set(officialNames);

    // Create mapping of lowercase official names to exact official names
    const exactMapping = {};
    for (const name of officialNames) {
        exactMapping[name.toLowerCase()] = name;
    }

    let sqlOutput = `-- ==============================================================================
-- AUTO-GENERATED NORMALIZATION SCRIPT
-- ==============================================================================
-- This script safely updates misspelled professor names to match teachers_data.json.
-- If the correctly spelled professor already exists, it MERGES the typo into the correct one.
-- If the correctly spelled professor DOES NOT exist yet, it RENAMES the typo to the correct one.
--
-- PLEASE REVIEW ALL SUGGESTED CHANGES BEFORE RUNNING.
-- ==============================================================================

DO $$
DECLARE
    prim_id UUID;
    dup_id UUID;
BEGIN
`;

    let matchedCount = 0;
    let ignoredCount = 0;

    for (const dbProf of dbProfessors) {
        const dbName = dbProf.name;

        // 1. Exact match - do nothing (it's already perfect)
        if (officialNameSet.has(dbName)) {
            ignoredCount++;
            continue;
        }

        // 2. Case insensitive exact match (e.g. "john smith" -> "John Smith")
        if (exactMapping[dbName.toLowerCase()]) {
            const correctName = exactMapping[dbName.toLowerCase()];
            sqlOutput += generateSqlAction(dbProf, correctName, dbProfessors, "case-insensitive match");
            matchedCount++;
            continue;
        }

        // 3. Fuzzy matching
        let bestMatch = null;
        let bestScore = Infinity;
        let matchReason = "";

        // Collect all possible matches to see if there's ambiguity
        let subsetMatches = [];

        for (const officialName of officialNames) {
            // Check for swapped words
            if (areWordsSwapped(dbName, officialName)) {
                bestMatch = officialName;
                bestScore = 0;
                matchReason = "swapped words";
                break; // Found an absolute certainty
            }

            // Check Levenshtein distance
            const dist = levenshtein(dbName.toLowerCase(), officialName.toLowerCase());
            if (dist <= 2 && dist < bestScore) {
                // If it's a 1 or 2 letter typo, it's very likely a match
                // We ensure it's longer than 5 chars so we don't accidentally match "Li" to "Lu"
                if (Math.max(dbName.length, officialName.length) > 5) {
                    bestMatch = officialName;
                    bestScore = dist;
                    matchReason = `typo (distance ${dist})`;
                }
            }

            // Subset match (e.g., "Aitbayeva Asel" in DB vs "Aitbayeva Asel Nurkanat" in JSON)
            if (tokenize(dbName).length >= 2 && isSubset(dbName, officialName)) {
                subsetMatches.push(officialName);
            }
        }

        if (bestMatch) {
            sqlOutput += generateSqlAction(dbProf, bestMatch, dbProfessors, matchReason);
            matchedCount++;
        } else if (subsetMatches.length === 1) {
            // If it's a subset of EXACTLY ONE official professor, it's safe to assume it's them.
            sqlOutput += generateSqlAction(dbProf, subsetMatches[0], dbProfessors, "unambiguous partial name match");
            matchedCount++;
        } else {
            // No confident match found
            ignoredCount++;
        }
    }

    sqlOutput += `
END $$;
`;

    fs.writeFileSync('supabase/auto_normalize_professors.sql', sqlOutput);
    console.log(`\nDone! Analyzed ${dbProfessors.length} DB records.`);
    console.log(`=> Found ${matchedCount} records that need fixing.`);
    console.log(`=> Ignored ${ignoredCount} records (either already perfect or no confident match).`);
    console.log(`=> Wrote SQL to: supabase/auto_normalize_professors.sql`);
}

function generateSqlAction(dbProf, officialName, allDbProfessors, reason) {
    // Check if the TRUE official name ALREADY exists as another row in the DB
    const officialExistsInDb = allDbProfessors.find(p => p.name === officialName);

    let sql = `    
    -- DB Name: "${dbProf.name}"
    -- Official Name: "${officialName}"
    -- Reason: ${reason}
`;

    if (officialExistsInDb && officialExistsInDb.id !== dbProf.id) {
        // True profile exists. We must MERGE dbProf into officialExistsInDb
        sql += `    SELECT id INTO prim_id FROM public.professors WHERE name = '${officialName.replace(/'/g, "''")}' LIMIT 1;
    IF prim_id IS NOT NULL THEN
        RAISE NOTICE 'Merging "%" into "%"', '${dbProf.name.replace(/'/g, "''")}', '${officialName.replace(/'/g, "''")}';
        PERFORM merge_professors(prim_id, '${dbProf.id}');
    END IF;
`;
    } else {
        // True profile DOES NOT exist in DB yet. We can just RENAME dbProf to the official name
        sql += `    RAISE NOTICE 'Renaming "%" to "%"', '${dbProf.name.replace(/'/g, "''")}', '${officialName.replace(/'/g, "''")}';
    UPDATE public.professors SET name = '${officialName.replace(/'/g, "''")}' WHERE id = '${dbProf.id}';
`;
    }

    return sql;
}

run();
