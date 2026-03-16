"use client";

import React, { useState, useTransition } from 'react';
import { MessageSquare, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { submitSuggestion } from '@/app/actions';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/AuthProvider';

export default function SuggestionsPage() {
    const [text, setText] = useState('');
    const [isPending, startTransition] = useTransition();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { user, loading } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;

        startTransition(async () => {
            const result = await submitSuggestion(text);
            if (result.success) {
                toast.success('Suggestion submitted successfully!');
                setIsSubmitted(true);
                setText('');
            } else {
                toast.error(result.error || 'Failed to submit suggestion');
            }
        });
    };

    if (isSubmitted) {
        return (
            <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 antialiased justify-center items-center p-6 text-center">
                <div className="p-8 max-w-md w-full space-y-6">
                    <div className="flex justify-center">
                        <div className="bg-green-500 p-4 rounded-full text-white">
                            <CheckCircle2 size={40} />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Thank You!</h2>
                    <p className="text-gray-500 dark:text-zinc-400 leading-relaxed">
                        Your suggestion has been received. We review all feedback to improve the platform for everyone.
                    </p>
                    <Link 
                        href="/professors" 
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gray-950 dark:bg-zinc-100 text-white dark:text-gray-950 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-zinc-200 w-full justify-center"
                    >
                        Back to Professors
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 antialiased">
            <header className="py-12 sm:py-20 px-6 border-b border-gray-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Link 
                        href="/professors" 
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-950 dark:hover:text-white"
                    >
                        <ArrowLeft size={16} />
                        Back to Professors
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-blue-500">
                        <MessageSquare size={12} />
                        Feedback Channel
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-950 dark:text-white leading-[1.1]">
                        Got <span className="text-gray-400 dark:text-zinc-600">Suggestions?</span>
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                        We're building this for you. Tell us which professors should be added next or how we can make the platform better.
                    </p>
                </div>
            </header>

            <main className="flex-1 py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-8">
                            <div className="space-y-4">
                                <label htmlFor="suggestion" className="text-lg font-bold tracking-tight">
                                    Your Message
                                </label>
                                <textarea
                                    id="suggestion"
                                    rows={6}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="I'd like to see Professor Smith added from the Physics department..."
                                    className="w-full p-6 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl text-gray-900 dark:text-zinc-100 focus:border-blue-500 outline-none resize-none"
                                    maxLength={500}
                                    required
                                />
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <span>Max 500 characters</span>
                                    <span>{text.length}/500</span>
                                </div>
                            </div>

                            {!user && !loading ? (
                                <div className="p-6 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-xl text-center space-y-4">
                                    <p className="text-gray-500 dark:text-zinc-400">
                                        You must be logged in to submit a suggestion.
                                    </p>
                                    <Link
                                        href="/login"
                                        className="inline-flex px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                                    >
                                        Login Now
                                    </Link>
                                </div>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isPending || !text.trim() || loading}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-zinc-800 disabled:text-gray-400 text-white rounded-xl font-bold flex items-center justify-center gap-3"
                                >
                                    {isPending ? (
                                        <span>Submitting...</span>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Submit Suggestion
                                        </>
                                    )}
                                </button>
                            )}
                        </form>
                </div>
            </main>
        </div>
    );
}
