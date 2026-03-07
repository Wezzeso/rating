'use client';

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Activity } from 'lucide-react';

export function LiveVisitorCount() {
    const [count, setCount] = useState<number>(0);

    useEffect(() => {
        if (!db) return;
        const visitorsRef = ref(db, 'visitors');

        const unsubscribe = onValue(visitorsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Count how many valid visitor objects exist
                const visitorKeys = Object.keys(data);
                const activeCount = visitorKeys.filter(key => data[key]?.online).length;
                setCount(activeCount);
            } else {
                setCount(0);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="col-span-1 md:col-span-1 lg:col-span-2 bg-zinc-900 border border-zinc-800 dark:bg-black text-white rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden relative shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl">
            <div className="relative z-10 flex justify-between items-start">
                <div className="p-3 bg-zinc-800/60 backdrop-blur-md rounded-2xl text-emerald-400 border border-zinc-700/50">
                    <Activity className="w-6 h-6" />
                </div>
                {/* Live indicator pip */}
                <div className="flex items-center gap-2 bg-zinc-800/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700/50 shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Live</span>
                </div>
            </div>

            <div className="relative z-10 z-[2]">
                <p className="text-5xl font-black tracking-tighter text-white">{count}</p>
                <p className="text-sm font-medium text-zinc-300 mt-2">Active Visitors on Site</p>
            </div>

            {/* Background decorative waves or blur */}
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500 rounded-full blur-[80px]"></div>
                <div className="absolute top-12 left-12 w-32 h-32 bg-blue-500 rounded-full blur-[80px]"></div>
            </div>
        </div>
    );
}
