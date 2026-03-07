'use client';

import { useEffect, useRef } from 'react';
import { ref, set, onDisconnect } from 'firebase/database';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

export function useLiveVisitors() {
    const initialized = useRef(false);

    useEffect(() => {
        if (!db || initialized.current) return;
        initialized.current = true;

        const sessionId = uuidv4();
        const visitorRef = ref(db, `visitors/${sessionId}`);

        // Try to add the user to the realtime database
        set(visitorRef, {
            online: true,
            timestamp: Date.now(),
        }).catch(err => console.error("Firebase Add visitor error:", err));

        // When the client disconnects, remove this entry
        onDisconnect(visitorRef).remove().catch(err => console.error("Firebase onDisconnect error:", err));

        return () => {
            // Cleanup visually on unmount (e.g., navigating away in SPA)
            set(visitorRef, null).catch(() => { });
        };
    }, []);
}
