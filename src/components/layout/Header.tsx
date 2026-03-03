"use client";

import Link from 'next/link';
import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { LogoIcon } from '../ui/LogoIcon';

export function Header() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md ">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 relative">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 transition-transform group-hover:scale-105 p-[4px]">
                            <LogoIcon className="h-full w-full" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300  truncate max-w-[200px] sm:max-w-none">Rate your professor</span>
                    </Link>

                    <nav className="hidden sm:flex items-center ml-8 space-x-6">
                        <Link
                            href="/groups"
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            Find My Group
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {/* Mobile Navigation */}
                    <nav className="sm:hidden flex items-center mr-2">
                        <Link
                            href="/groups"
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                        >
                            Groups
                        </Link>
                    </nav>
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white  p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
                            aria-label="Toggle theme"
                            title="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
