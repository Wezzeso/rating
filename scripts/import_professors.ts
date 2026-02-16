import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY not found — falling back to anon key (may fail due to RLS).");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importProfessors() {
    const csvPath = path.resolve(process.cwd(), "professors.csv");

    if (!fs.existsSync(csvPath)) {
        console.error("professors.csv not found!");
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, "utf-8");
    const lines = fileContent.trim().split("\n");

    // Assume header: name,department
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, "").toLowerCase());

    const professors = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // improved quote handling for simple cases like "Name","Dept"
        // This is a naive split, use a library for complex CSVs
        const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

        if (!parts || parts.length < 2) continue;

        const name = parts[0].replace(/"/g, "").trim();
        const department = parts[1].replace(/"/g, "").trim();

        professors.push({
            name,
            department,
            is_approved: true // Auto-approve imported ones? Or false? Let's say true for bulk import.
        });
    }

    console.log(`Found ${professors.length} professors to import...`);

    const { data, error } = await supabase
        .from("professors")
        .insert(professors)
        .select();

    if (error) {
        console.error("Error importing:", error);
    } else {
        console.log(`Successfully imported ${data.length} professors!`);
    }
}

importProfessors();
