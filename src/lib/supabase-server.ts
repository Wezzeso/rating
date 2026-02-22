

import { createClient } from '@supabase/supabase-js';

/**
 * Admin Supabase client using the service role key.
 * Bypasses RLS — use ONLY in trusted server-side code.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. ' +
      'Add it to .env.local (find it in Supabase → Settings → API).'
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
