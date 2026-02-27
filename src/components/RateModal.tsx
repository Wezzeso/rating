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
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const AVAILABLE_TAGS = [
        "Pray for your Scholorship", "Retake", "AI Strict", "Tough but fair", "You are cooked lil bro", "Attendance is key", "Chill vibes", "Best teacher", "Extra credit", "Psychological Horror", "Participation matters", "Respect is key", "+swag +rep", "Favourite teacher", "Fair game", "Hard grader", "cringe"
    ];

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            if (selectedTags.length < 3) {
                setSelectedTags([...selectedTags, tag]);
            } else {
                toast.error("You can only select up to 3 tags.");
            }
        }
    };

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
                tags: selectedTags,
            });

            if (!result.success) {
                toast.error(result.error || "An error occurred.");
            } else {
                toast.success("Rating submitted!");
                onSuccess();
                onClose();
                setTeachingRating(0);
                setProctoringRating(0);
                setSelectedTags([]);
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

                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 ">
                    Rate {professor.name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 ">
                    Share your experience anonymously.
                </p>

                <div className="space-y-6">
                    {/* Teaching Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ">
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
                                            : "fill-transparent text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400"
                                            } `}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Proctoring Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ">
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
                                            : "fill-transparent text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-400"
                                            } `}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4 sm:mt-0 ">
                            Tags (Select up to 3)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium  border ${isSelected
                                            ? "bg-black dark:bg-white text-white dark:text-gray-900 border-black dark:border-white"
                                            : "bg-white dark:bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900"
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-2 sticky bottom-0 bg-white dark:bg-gray-950 sm:static ">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-black dark:bg-white text-white dark:text-gray-900 py-3 sm:py-2.5 rounded-xl sm:rounded-md font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed "
                        >
                            {isSubmitting ? "Submitting..." : "Submit Rating"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
