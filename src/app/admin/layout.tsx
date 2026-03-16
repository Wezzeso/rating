"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { LayoutDashboard, Users, MessageSquare, LogOut, ShieldAlert } from "lucide-react";
import { logoutAdmin } from "@/app/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await logoutAdmin();
        toast.success("Logged out");
        // We reload to kick the admin out and show the login form 
        window.location.href = "/admin";
    };

    return (
        <AdminGuard>
            {/* The negative margin pulls the inner container out of the max-w-5xl width set in the root layout */}
            <div className="flex flex-col md:flex-row min-h-[85vh] bg-transparent w-screen max-w-none relative left-[50%] right-[50%] ml-[-50vw] mr-[-50vw]">
                {/* Sidebar */}
                <aside className="w-full md:w-64 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 p-4 md:p-6 flex flex-col gap-2 rounded-l-lg lg:rounded-l-2xl shadow-sm">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 px-2 lg:px-4">Admin Panel</h2>
                    </div>

                    <nav className="flex flex-col gap-2 flex-1">
                        <Link
                            href="/admin"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${pathname === "/admin"
                                ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900"
                                }`}
                        >
                            <LayoutDashboard size={18} />
                            Dashboard
                        </Link>

                        <Link
                            href="/admin/teachers"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${pathname.startsWith("/admin/teachers")
                                ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900"
                                }`}
                        >
                            <Users size={18} />
                            Teachers
                        </Link>

                        <Link
                            href="/admin/comments"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${pathname.startsWith("/admin/comments")
                                ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900"
                                }`}
                        >
                            <MessageSquare size={18} />
                            Comments
                        </Link>

                        <Link
                            href="/admin/requests"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${pathname.startsWith("/admin/requests")
                                ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900"
                                }`}
                        >
                            <ShieldAlert size={18} />
                            Removals
                        </Link>

                        <Link
                            href="/admin/suggestions"
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${pathname.startsWith("/admin/suggestions")
                                ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                                : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-900"
                                }`}
                        >
                            <MessageSquare size={18} />
                            Suggestions
                        </Link>
                    </nav>

                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-zinc-800">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 w-full bg-white dark:bg-zinc-950 lg:rounded-r-2xl shadow-sm md:overflow-y-auto">
                    {children}
                </main>
            </div>
        </AdminGuard>
    );
}
