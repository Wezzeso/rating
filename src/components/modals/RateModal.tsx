"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { toast } from "sonner";
import { submitRating, fetchUserRating } from "@/app/actions";
import { useAuth } from "@/components/providers/AuthProvider";
import { useEffect } from "react";
import Link from "next/link";

interface RateModalProps {
    professor: {
        id: string;
        name: string;
    };
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: any) => void;
}

export function RateModal({ professor, isOpen, onClose, onSuccess }: RateModalProps) {
    const [teachingRating, setTeachingRating] = useState(0);
    const [proctoringRating, setProctoringRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingRating, setExistingRating] = useState<any>(null);
    const [isLoadingRating, setIsLoadingRating] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen && user && professor.id) {
            setIsLoadingRating(true);
            fetchUserRating(professor.id).then(res => {
                if (res.success && res.data) {
                    setExistingRating(res.data);
                    setTeachingRating(res.data.teaching || 0);
                    setProctoringRating(res.data.proctoring || 0);
                    setSelectedTags(res.data.tags || []);
                } else {
                    setExistingRating(null);
                }
                setIsLoadingRating(false);
            });
        } else if (!isOpen) {
            // Reset state when closing
            setExistingRating(null);
            setTeachingRating(0);
            setProctoringRating(0);
            setSelectedTags([]);
        }
    }, [isOpen, user, professor.id]);

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
        if (existingRating) return; // Prevent double submission if UI somehow allows it

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
                onSuccess({
                    teaching: teachingRating === 0 ? null : teachingRating,
                    proctoring: proctoringRating === 0 ? null : proctoringRating,
                    tags: selectedTags
                });
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
                className="w-full max-w-md bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-t-2xl sm:rounded-lg shadow-xl p-6 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-1 ">
                    Rate {professor.name}
                </h2>
                <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6 ">
                    Share your experience anonymously.
                </p>

                <div className="space-y-6">
                    {/* Teaching Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-100 mb-2 ">
                            Teaching
                        </label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => !existingRating && setTeachingRating(star)}
                                    disabled={!!existingRating}
                                    className={`focus:outline-none transition-transform ${!existingRating && "hover:scale-110"}`}
                                >
                                    <Star
                                        size={28}
                                        className={`${star <= teachingRating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-transparent text-gray-300 dark:text-zinc-800 " + (!existingRating ? "hover:text-yellow-400 dark:hover:text-yellow-400" : "")
                                            } `}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Proctoring Rating */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-100 mb-2 ">
                            Proctoring
                        </label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => !existingRating && setProctoringRating(star)}
                                    disabled={!!existingRating}
                                    className={`focus:outline-none transition-transform ${!existingRating && "hover:scale-110"}`}
                                >
                                    <Star
                                        size={28}
                                        className={`${star <= proctoringRating
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "fill-transparent text-gray-300 dark:text-zinc-800 " + (!existingRating ? "hover:text-yellow-400 dark:hover:text-yellow-400" : "")
                                            } `}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tags Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-zinc-100 mb-2 mt-4 sm:mt-0 ">
                            Tags (Select up to 3)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_TAGS.map((tag) => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                    <button
                                        key={tag}
                                        onClick={() => !existingRating && toggleTag(tag)}
                                        disabled={!!existingRating}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isSelected
                                            ? "bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 border-black dark:border-zinc-100"
                                            : "bg-white dark:bg-zinc-900/30 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-800 " + (!existingRating ? "hover:border-gray-300 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/80" : "opacity-50")
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-4 pb-8 px-6 -mb-6 -mx-6 sticky bottom-0 bg-white dark:bg-zinc-900 sm:static sm:bg-transparent dark:sm:bg-transparent sm:mx-0 sm:px-0 sm:pb-0 sm:mb-0 sm:pt-2 border-t border-gray-100 dark:border-zinc-800 sm:border-transparent">
                        {!user ? (
                            <div className="text-center space-y-3">
                                <p className="text-sm text-gray-500 dark:text-zinc-400">
                                    You must be logged in to rate.
                                </p>
                                <Link
                                    href="/login"
                                    className="block w-full bg-blue-600 text-white py-3 sm:py-2.5 rounded-xl sm:rounded-md font-medium text-sm hover:bg-blue-700 transition-colors"
                                >
                                    Login to Rate
                                </Link>
                            </div>
                        ) : existingRating ? (
                            <div className="text-center space-y-3">
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl">
                                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                        You have already rated this professor.
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 py-3 sm:py-2.5 rounded-xl sm:rounded-md font-medium text-sm hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || isLoadingRating}
                                className="w-full bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 sm:py-2.5 rounded-xl sm:rounded-md font-medium text-sm hover:bg-gray-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? "Submitting..." : isLoadingRating ? "Checking..." : "Submit Rating"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
