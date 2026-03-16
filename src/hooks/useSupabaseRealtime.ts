'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';

/**
 * A custom hook to subscribe to real-time changes in Supabase tables.
 * @param table The name of the table to listen to.
 * @param callback A function to call when a change occurs.
 * @param event The type of event to listen for ('*' for all events, 'INSERT', 'UPDATE', 'DELETE').
 */
export function useSupabaseRealtime(
    table: string,
    callback: (payload: any) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'
) {
    const supabase = createBrowserClient();

    useEffect(() => {
        const channel = supabase
            .channel(`realtime:${table}`)
            .on(
                'postgres_changes',
                {
                    event: event,
                    schema: 'public',
                    table: table,
                },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, event, callback, supabase]);
}
