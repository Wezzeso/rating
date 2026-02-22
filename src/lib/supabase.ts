/**
 * Supabase Auth/JWTs have been disabled in this project.
 * You cannot use a client-side Supabase instance.
 * All fetches and mutations must be done securely on the server
 * via Next.js Server Actions using the `service_role` key.
 */
export function getSupabase() {
    throw new Error(
        'Client-side Supabase calls are disabled. ' +
        'Use Server Actions from `src/app/actions.ts` to perform database operations.'
    );
}

/**
 * @deprecated Use Server Actions instead.
 */
export const supabase = typeof window !== 'undefined'
    ? new Proxy({}, {
        get() {
            throw new Error('Supabase client is disabled.');
        },
    })
    : new Proxy({}, {
        get() {
            throw new Error(
                'Cannot use the `supabase` export on the server. ' +
                'Use Server Actions instead.'
            );
        },
    });

