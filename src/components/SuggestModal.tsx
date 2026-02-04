"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
            const { error } = await supabase.from("professors").insert({
                name,
                department: "General",
                is_approved: false,
            });

            if (error) {
                toast.error("Failed to submit suggestion. Please try again.");
                console.error(error);
            } else {
                toast.success("Professor suggested! Pending approval.");
                onClose();
                setName("");
            }
        } catch (err) {
            console.error(err);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Suggest a Professor
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                            placeholder="e.g. Dr. Jane Doe"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-black text-white py-2.5 rounded-md font-medium text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Suggestion"}
                    </button>
                </div>
            </div>
        </div>
    );
}
