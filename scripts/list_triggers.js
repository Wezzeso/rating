const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTriggers() {
    console.log('Listing triggers for ratings table...');

    const { data, error } = await supabase.rpc('get_triggers', { table_name: 'ratings' });

    if (error) {
        // If RPC doesn't exist, try custom query via another way or just assume we need to list them
        console.error('Error listing triggers via RPC:', error);

        // Let's try to find triggers via a raw select if we have a way... 
        // Actually, we can just try to see if we can find any custom functions that might be triggers.
        const { data: functions, error: funcError } = await supabase
            .from('pg_proc') // This won't work via public API usually
            .select('*')
            .limit(1);

        console.log('Direct PG access test:', funcError ? 'FAILED' : 'SUCCESS');
    } else {
        console.log('Triggers:', data);
    }
}

// Since we might not have a 'get_triggers' RPC, let's try to just check the extensions
async function checkRealtimeExtension() {
    console.log('Checking extensions...');
    // We can't easily check extensions via public API without RPC.

    // Let's try to just RUN a query that lists triggers if possible
    // But we don't have a raw SQL tool.
}

listTriggers();
