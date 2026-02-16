import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 * Uses cookies for session storage (instead of localStorage),
 * so the server can verify auth state via middleware and Server Actions.
 * Only use in "use client" components.
 * 
 * Lazily initialized to avoid crashes during SSR prerendering.
 */
let _supabase: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
    if (!_supabase) {
        _supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }
    return _supabase;
}

/**
 * @deprecated Use getSupabase() instead.
 * This named export is kept only for backward compatibility.
 * It will throw a helpful error if used on the server.
 */
export const supabase = typeof window !== 'undefined'
    ? createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    : new Proxy({} as ReturnType<typeof createBrowserClient>, {
        get() {
            throw new Error(
                'Cannot use the `supabase` export on the server. ' +
                'Use `createServerSupabaseClient()` from `@/lib/supabase-server` instead.'
            );
        },
    });

