"use client";

import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface RateModalProps {
    professor: {
        id: string;
        name: string;
    };
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function RateModal({ professor, isOpen, onClose, onSuccess }: RateModalProps) {
    const [teachingRating, setTeachingRating] = useState(0);
    const [proctoringRating, setProctoringRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Ensure fingerprint exists
        let fp = localStorage.getItem("vibe_rater_id");
        if (!fp) {
            fp = uuidv4();
            localStorage.setItem("vibe_rater_id", fp);
        }
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (teachingRating === 0 && proctoringRating === 0) {
            toast.error("Please rate at least one category.");
            return;
        }

        setIsSubmitting(true);
        const fingerprint = localStorage.getItem("vibe_rater_id");

        try {
            const { error } = await supabase.from("ratings").insert({
                professor_id: professor.id,
                user_fingerprint: fingerprint,
                teaching: teachingRating === 0 ? null : teachingRating,
                proctoring: proctoringRating === 0 ? null : proctoringRating,
            });

            if (error) {
                if (error.code === "23505") {
                    toast.error("You have already rated this professor.");
                } else {
                    toast.error("An error occurred. Please try again.");
                    console.error(error);
                }
            } else {
                toast.success("Rating submitted!");
                onSuccess();
                onClose();
                // Reset local state if needed, though unmount logic handles it typically
                setTeachingRating(0);
                setProctoringRating(0);
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

                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    Rate {professor.name}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                    Share your experience anonymously.
                </p>

                <div className="space-y-6">
                    {/* Teaching Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teaching
                        </label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setTeachingRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={28}
                                        className={`${star <= teachingRating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-transparent text-gray-300 hover:text-yellow-400"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Proctoring Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Proctoring
                        </label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setProctoringRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star
                                        size={28}
                                        className={`${star <= proctoringRating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-transparent text-gray-300 hover:text-yellow-400"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full bg-black text-white py-2.5 rounded-md font-medium text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Rating"}
                    </button>
                </div>
            </div>
        </div>
    );
}
