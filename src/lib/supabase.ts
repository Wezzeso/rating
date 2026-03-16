import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser (client components).
 * Uses the public anon key — RLS protects the data.
 */
export function createBrowserClient() {
    return createSupabaseBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
