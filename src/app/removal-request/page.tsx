"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    ShieldAlert,
    ArrowLeft,
    Send,
    Loader2,
    Info,
    CheckCircle2,
    User,
    Mail,
    MessageSquare,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { submitRemovalRequest } from "@/app/actions/removal";

export default function RemovalRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        professorName: "",
        officialEmail: "",
        reason: "",
        acceptedTerms: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.professorName || !formData.officialEmail || !formData.reason) {
            toast.error("Please fill in all fields.");
            return;
        }


        if (!formData.acceptedTerms) {
            toast.error("You must accept the terms and conditions.");
            return;
        }

        setLoading(true);
        try {
            const res = await submitRemovalRequest(formData);
            if (res.success) {
                setSubmitted(true);
                toast.success("Request submitted successfully.");
            } else {
                toast.error(res.error || "Failed to submit request.");
            }
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-4 tracking-tight">Request Received</h1>
                <p className="text-gray-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed mb-8">
                    We have received your removal request. Our team will verify your identity via your official email and review your request. This process usually takes 1-3 business days.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to homepage
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto w-full min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 mb-6 group transition-colors"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    Go back
                </button>

                <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
                        Removal Request
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
                        We believe students have a right to rate professors anonymously. However, if you have concerns about your data, please fill out this form.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.professorName}
                                onChange={(e) => setFormData({ ...formData, professorName: e.target.value })}
                                placeholder="e.g., John Doe"
                                className="w-full px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-600 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-shadow"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                                Official Email
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.officialEmail}
                                onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                                placeholder="j.doe@university.edu"
                                className="w-full px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-600 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-shadow"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                            Reason for Removal
                        </label>
                        <textarea
                            required
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="Please explain why you want your profile to be removed..."
                            className="w-full px-3 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-600 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-shadow min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="flex items-start gap-2.5">
                        <input
                            id="agree-terms"
                            type="checkbox"
                            checked={formData.acceptedTerms}
                            onChange={(e) => setFormData({ ...formData, acceptedTerms: e.target.checked })}
                            className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 focus:ring-gray-300 dark:focus:ring-zinc-600 cursor-pointer accent-gray-900 dark:accent-zinc-100"
                        />
                        <label htmlFor="agree-terms" className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed cursor-pointer">
                            I accept the <Link href="/terms" className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Terms and Conditions</Link> and understand that this request will be reviewed. Identity verification is required.
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !formData.acceptedTerms}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Send size={16} />
                        )}
                        {loading ? "Submitting..." : "Submit Removal Request"}
                    </button>
                </form>

                <div className="mt-8 flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-zinc-600">
                    <AlertCircle size={10} />
                    Identity verification via official email required
                </div>
            </div>
        </div>
    );
}
