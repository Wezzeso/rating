'use client';

import { useLiveVisitors } from '@/hooks/useLiveVisitors';

export function LiveVisitorTracker() {
    useLiveVisitors();
    return null;
}
