"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { suggestProfessor } from "@/app/actions";

interface SuggestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SuggestModal({ isOpen, onClose }: SuggestModalProps) {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Please enter a name.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await suggestProfessor({ name });

            if (!result.success) {
                toast.error(result.error || "Failed to submit suggestion.");
            } else {
                toast.success("Professor suggested! Pending approval.");
                onClose();
                setName("");
            }
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 transition-opacity"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-t-2xl sm:rounded-lg shadow-xl p-6 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 "
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-6 ">
                    Suggest a Professor
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-100 mb-1 ">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={100}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/50 text-gray-900 dark:text-zinc-100 rounded-md focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-zinc-400 focus:border-black dark:focus:border-zinc-400 transition-colors"
                            placeholder="e.g. Dr. Jane Doe"
                        />
                    </div>

                    <div className="pt-4 pb-8 px-6 -mb-6 -mx-6 sticky bottom-0 bg-white dark:bg-zinc-900 sm:static sm:bg-transparent dark:sm:bg-transparent sm:mx-0 sm:px-0 sm:pb-0 sm:mb-0 sm:pt-2 border-t border-gray-100 dark:border-zinc-800 sm:border-transparent">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 sm:py-2.5 rounded-xl sm:rounded-md font-medium text-sm hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed  mt-2 transition-colors"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Suggestion"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
