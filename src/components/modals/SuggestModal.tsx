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
                className="w-full max-w-md bg-white dark:bg-gray-950 rounded-t-2xl sm:rounded-lg shadow-xl p-6 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 "
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 ">
                    Suggest a Professor
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={100}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 focus:border-black dark:focus:border-gray-500 "
                            placeholder="e.g. Dr. Jane Doe"
                        />
                    </div>

                    <div>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-black dark:bg-white text-white dark:text-gray-900 py-3 sm:py-2.5 rounded-xl sm:rounded-md font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed  mt-2"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Suggestion"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
