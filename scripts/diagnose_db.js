const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking ratings table schema...');

    // Try to select user_email from ratings
    const { data, error } = await supabase
        .from('ratings')
        .select('user_email')
        .limit(1);

    if (error) {
        console.error('Error fetching user_email column:', error);
        if (error.code === '42703') {
            console.error('\n[DIAGNOSIS] The "user_email" column is MISSING from the "ratings" table.');
            console.error('Please run the following SQL in your Supabase SQL Editor:');
            console.error('ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS user_email text;');
            console.error('ALTER TABLE public.ratings ADD CONSTRAINT ratings_professor_id_user_email_key UNIQUE (professor_id, user_email);');
        }
    } else {
        console.log('SUCCESS: user_email column exists.');
    }
}

checkSchema();
