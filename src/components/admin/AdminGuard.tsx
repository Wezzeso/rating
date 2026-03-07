"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { checkAdminAuth, loginAsAdmin } from "@/app/actions";

export function AdminGuard({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [password, setPassword] = useState("");

    useEffect(() => {
        const initAuth = async () => {
            const authResult = await checkAdminAuth();
            if (authResult.isAdmin) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await loginAsAdmin(password);
        if (!result.success) {
            toast.error(result.error);
            setLoading(false);
        } else {
            toast.success("Logged in successfully");
            setPassword("");
            setIsAuthenticated(true);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-zinc-800"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-transparent px-4 py-8">
                <div className="max-w-md w-full bg-white dark:bg-zinc-950 rounded-lg shadow-md p-8 ">
                    <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-zinc-100">Admin Login</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-100 ">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 px-3 py-2 focus:border-black dark:focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-zinc-500 "
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-black dark:bg-white text-white dark:text-zinc-900 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-zinc-200 "
                        >
                            Sign In
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
