"use client";

import Link from 'next/link';
import { Sun, Moon, LogIn, LogOut, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { LogoIcon } from '../ui/LogoIcon';
import { useAuth } from '../providers/AuthProvider';
import { toast } from 'sonner';

export function Header() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const { user, loading, signOut } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        setDropdownOpen(false);
        toast.success('Logged out');
    };

    // Truncate email for display
    const displayEmail = user?.email
        ? user.email.length > 20
            ? user.email.slice(0, 17) + '...'
            : user.email
        : '';

    const navigationLinks = [
        { href: '/groups', label: 'Find My Group' },
        { href: '/disciplines', label: 'Disciplines' },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md ">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 relative">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 transition-transform group-hover:scale-105 p-[4px]">
                            <LogoIcon className="h-full w-full" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 group-hover:text-gray-700 dark:group-hover:text-zinc-300  truncate max-w-[200px] sm:max-w-none">Rate your professor</span>
                    </Link>

                    <nav className="hidden sm:flex items-center gap-4 ml-3">
                        {navigationLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {/* Mobile Navigation */}
                    <nav className="sm:hidden flex items-center mr-1 gap-2">
                        {navigationLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                            >
                                {link.label === 'Find My Group' ? 'Groups' : link.label}
                            </Link>
                        ))}
                        <Link
                            href="/"
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                        >
                            About
                        </Link>
                    </nav>

                    {/* Auth Section */}
                    {mounted && !loading && (
                        <>
                            {user ? (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
                                    >
                                        <User size={16} />
                                        <span className="hidden sm:inline">{displayEmail}</span>
                                    </button>

                                    {dropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 z-50">
                                            <div className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800">
                                                <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{user.email}</p>
                                            </div>
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                            >
                                                <LogOut size={14} />
                                                Sign out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 px-2.5 py-1.5 rounded-md border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                                >
                                    <LogIn size={14} />
                                    <span className="hidden sm:inline">Login</span>
                                </Link>
                            )}
                        </>
                    )}

                    {/* Theme Toggle */}
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100  p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900"
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
