'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';

/**
 * A custom hook to subscribe to real-time broadcast messages in Supabase.
 * @param channelName The name of the channel to listen to (e.g., 'professor:uuid').
 * @param eventName The name of the event to listen for (e.g., 'rating_updated').
 * @param callback A function to call when a message is received.
 */
export function useSupabaseBroadcast(
    channelName: string,
    eventName: string,
    callback: (payload: any) => void
) {
    const supabase = createBrowserClient();

    useEffect(() => {
        const channel = supabase.channel(channelName, {
            config: {
                broadcast: { self: false },
            },
        });

        channel
            .on('broadcast', { event: eventName }, (payload) => {
                callback(payload);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    // Subscribed successfully
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [channelName, eventName, callback, supabase]);
}
