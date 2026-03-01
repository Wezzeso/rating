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

function normalizeName(name) {
    // Remove suffixes like "- CHIN", "- ger", "- ITA", etc.
    let cleaned = name.replace(/\s*-\s*[A-Za-z]{2,5}(\s+.*)?$/i, '');
    // Clean up extra spaces
    cleaned = cleaned.trim().replace(/\s+/g, ' ');
    return cleaned;
}

function areWordsSwapped(str1, str2) {
    const words1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).sort().join(' ');
    const words2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).sort().join(' ');
    return words1 === words2 && words1.length > 0;
}

async function run() {
    console.log("Fetching professors from database...");
    const { data: dbProfessors, error } = await supabase.from('professors').select('*');
    if (error) {
        console.error("Error fetching professors:", error);
        return;
    }
    console.log(`Found ${dbProfessors.length} professors in DB.`);

    let sqlOutput = `-- ==============================================================================\n`;
    sqlOutput += `-- AUTO-GENERATED CLEANUP AND MERGE SCRIPT\n`;
    sqlOutput += `-- ==============================================================================\n\n`;
    sqlOutput += `DO $$\nBEGIN\n\n`;

    // 1. Remove Vacancy
    const vacancies = dbProfessors.filter(p => p.name.toLowerCase().includes('vacancy'));
    for (const v of vacancies) {
        sqlOutput += `    -- Deleting Vacancy: ${v.name}\n`;
        sqlOutput += `    DELETE FROM public.professors WHERE id = '${v.id}';\n\n`;
    }

    const validProfs = dbProfessors.filter(p => !p.name.toLowerCase().includes('vacancy'));

    // Sort so shortest names are first. They are preferred as primary.
    validProfs.sort((a, b) => a.name.length - b.name.length);

    let processedDbIds = new Set();
    let mergers = 0;

    for (let i = 0; i < validProfs.length; i++) {
        const prim = validProfs[i];
        if (processedDbIds.has(prim.id)) continue;

        processedDbIds.add(prim.id);
        const normPrim = normalizeName(prim.name);

        for (let j = i + 1; j < validProfs.length; j++) {
            const dup = validProfs[j];
            if (processedDbIds.has(dup.id)) continue;

            const normDup = normalizeName(dup.name);

            let isMatch = false;
            let reason = "";

            if (normPrim.toLowerCase() === normDup.toLowerCase()) {
                isMatch = true;
                reason = "exact normalized match";
            } else if (normDup.toLowerCase().includes(normPrim.toLowerCase()) && normDup.length > normPrim.length) {
                isMatch = true;
                reason = "duplicate has extra words/suffix";
            } else if (normPrim.toLowerCase().includes(normDup.toLowerCase()) && normPrim.length > normDup.length) {
                isMatch = true;
                reason = "primary has extra words/suffix";
            } else if (areWordsSwapped(normPrim, normDup)) {
                isMatch = true;
                reason = "swapped words";
            } else {
                const dist = levenshtein(normPrim.toLowerCase(), normDup.toLowerCase());
                if (dist <= 2 && Math.max(normPrim.length, normDup.length) > 5) {
                    isMatch = true;
                    reason = `typo (distance ${dist})`;
                }
            }

            if (isMatch) {
                processedDbIds.add(dup.id);
                sqlOutput += `    -- DB Name: "${dup.name}" -> Merging into: "${prim.name}"\n`;
                sqlOutput += `    -- Reason: ${reason}\n`;
                sqlOutput += `    RAISE NOTICE 'Merging "%" into "%"', '${dup.name.replace(/'/g, "''")}', '${prim.name.replace(/'/g, "''")}';\n`;
                sqlOutput += `    PERFORM merge_professors('${prim.id}', '${dup.id}');\n\n`;
                mergers++;
            }
        }
    }

    sqlOutput += `END $$;\n`;
    fs.writeFileSync('supabase/clean_duplicates.sql', sqlOutput);
    console.log(`\nGenerated ${mergers} merge operations.`);
    console.log(`Generated ${vacancies.length} delete operations for Vacancy.`);
    console.log(`SQL written to supabase/clean_duplicates.sql`);
}

run();
