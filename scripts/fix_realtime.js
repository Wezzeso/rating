const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRealtime() {
    console.log('Attempting to identify and fix triggers...');

    // Since we can't run raw SQL directly without RPC, let's try to find an RPC that might exist 
    // or try to use a common Supabase function if available.

    // If the error is 'function realtime.broadcast(text, unknown, jsonb) does not exist',
    // it means a trigger is calling it.

    console.log('\n[MANUAL ACTION REQUIRED]');
    console.log('The error "function realtime.broadcast(text, unknown, jsonb) does not exist"');
    console.log('is likely caused by a database trigger that was created manually.');
    console.log('To fix this, please run the following SQL in your Supabase SQL Editor:');
    console.log(`
-- 1. Check for triggers on the ratings table
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.ratings'::regclass;

-- 2. If you see a trigger like 'on_rating_inserted', drop it:
-- DROP TRIGGER IF EXISTS on_rating_inserted ON public.ratings;

-- 3. Alternatively, define the missing broadcast function if you want to keep it:
-- CREATE SCHEMA IF NOT EXISTS realtime;
-- CREATE OR REPLACE FUNCTION realtime.broadcast(topic text, event text, payload jsonb)
-- RETURNS void LANGUAGE plpgsql AS $$
-- BEGIN
--   PERFORM pg_notify('realtime_broadcast', json_build_object('topic', topic, 'event', event, 'payload', payload)::text);
-- END;
-- $$;
    `);

    // Let's also check if we can simply REMOVE the table from the realtime publication and re-add it
    // maybe that was the issue?
    console.log('Trying to re-toggle realtime for the table...');
    const { error: pubError } = await supabase.rpc('retoggle_realtime', { tbl: 'ratings' });
    if (pubError) {
        console.log('Retoggle RPC failed (expected if not defined).');
    }
}

fixRealtime();
