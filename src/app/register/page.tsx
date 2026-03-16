"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { toast } from "sonner";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

/** Generic email regex */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail || !password || !confirmPassword) {
            toast.error("Please fill in all fields.");
            return;
        }

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            toast.error("Please enter a valid email address.");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        if (!agreedToTerms) {
            toast.error("You must agree to the Terms and Privacy Policy.");
            return;
        }

        setLoading(true);

        try {
            const supabase = createBrowserClient();
            const { error } = await supabase.auth.signUp({
                email: trimmedEmail,
                password,
            });

            if (error) {
                toast.error(error.message);
                return;
            }

            toast.success("Account created! Check your email to confirm your account.");
            router.push("/login");
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
                        Create Account
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                        Register with your student email
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label
                            htmlFor="register-email"
                            className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
                        >
                            Student Email
                        </label>
                        <input
                            id="register-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="student@university.edu"
                            autoComplete="email"
                            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-600 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-shadow"
                        />
                        <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                            Format: name@university.edu
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="register-password"
                            className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="register-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
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

                    <div>
                        <label
                            htmlFor="register-confirm-password"
                            className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5"
                        >
                            Confirm Password
                        </label>
                        <input
                            id="register-confirm-password"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat your password"
                            autoComplete="new-password"
                            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-600 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-shadow"
                        />
                    </div>

                    {/* Terms & Privacy Checkbox */}
                    <div className="flex items-start gap-2.5">
                        <input
                            id="agree-terms"
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 focus:ring-gray-300 dark:focus:ring-zinc-600 cursor-pointer accent-gray-900 dark:accent-zinc-100"
                        />
                        <label htmlFor="agree-terms" className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed cursor-pointer">
                            I agree to the{" "}
                            <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !agreedToTerms}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <UserPlus size={16} />
                        )}
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-400 dark:text-zinc-500">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-zinc-100 underline underline-offset-2 transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
