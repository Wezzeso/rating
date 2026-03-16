'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface PresenceContextType {
    visitorCount: number;
}

const PresenceContext = createContext<PresenceContextType>({ visitorCount: 0 });

export function PresenceProvider({ children }: { children: React.ReactNode }) {
    const [visitorCount, setVisitorCount] = useState(0);
    const supabase = createBrowserClient();

    useEffect(() => {
        const sessionId = uuidv4();

        const channel = supabase.channel('site_presence', {
            config: {
                presence: {
                    key: sessionId,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const count = Object.keys(state).length;
                setVisitorCount(count);
            })
            .subscribe(async (status: string) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <PresenceContext.Provider value={{ visitorCount }}>
            {children}
        </PresenceContext.Provider>
    );
}

export function usePresence() {
    return useContext(PresenceContext);
}
