import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

/**
 * Creates or returns a singleton Supabase client for use in browser (client components).
 * Uses the public anon key — RLS protects the data.
 */
export function createBrowserClient() {
    if (client) return client;

    client = createSupabaseBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    return client;
}
