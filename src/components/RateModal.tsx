"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { toast } from "sonner";
import { submitRating } from "@/app/actions";

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

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (teachingRating === 0 && proctoringRating === 0) {
            toast.error("Please rate at least one category.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await submitRating({
                professorId: professor.id,
                teachingScore: teachingRating === 0 ? null : teachingRating,
                proctoringScore: proctoringRating === 0 ? null : proctoringRating,
            });

            if (!result.success) {
                toast.error(result.error || "An error occurred.");
            } else {
                toast.success("Rating submitted!");
                onSuccess();
                onClose();
                setTeachingRating(0);
                setProctoringRating(0);
            }
        } catch {
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
