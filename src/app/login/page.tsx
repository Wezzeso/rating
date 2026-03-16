"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";
import { LogIn, Loader2, Eye, EyeOff, UserPlus, ShieldAlert, GraduationCap } from "lucide-react";
import Link from "next/link";

/** Only allow student emails: 2XXXXX@astanait.edu.kz */
const EMAIL_REGEX = /^2\d{5}@astanait\.edu\.kz$/i;

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-zinc-950">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchParams.get("error") === "invalid_email") {
            toast.error("Please use a valid email address.");
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail || !password.trim()) {
            toast.error("Please fill in all fields.");
            return;
        }

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            toast.error("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            const supabase = createBrowserClient();
            const { error } = await supabase.auth.signInWithPassword({
                email: trimmedEmail,
                password,
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success("Welcome back!");
            router.push("/");
            router.refresh();
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto w-full flex items-center justify-center min-h-[70vh] px-4 py-8">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                        Sign in with your student credentials
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label
                            htmlFor="login-email"
                            className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
                        >
                            Student Email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="student@university.edu"
                            autoComplete="email"
                            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-600 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-shadow"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="login-password"
                            className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className="w-full px-3 py-2.5 pr-10 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-600 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-shadow"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <LogIn size={16} />
                        )}
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <div className="mt-6 text-center space-y-4">
                    <p className="text-sm text-gray-400 dark:text-zinc-500">
                        Don't have an account?{" "}
                        <Link
                            href="/register"
                            className="text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-zinc-100 underline underline-offset-2 transition-colors"
                        >
                            Create Account
                        </Link>
                    </p>

                    <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/50">
                        <Link
                            href="/removal-request"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        >
                            <ShieldAlert size={14} />
                            Professor removal request
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

