"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, BookOpen, Shield, GraduationCap, Users, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/ui/StarRating";
import { ShareButton } from "@/components/ui/ShareButton";
import { RateModal } from "@/components/modals/RateModal";
import teachersDataRaw from "../../../data/teachers_data.json";

interface ScheduleData {
    teacherName: string;
    disciplines: string[];
    groups: string[];
}

const teachersData = teachersDataRaw as ScheduleData[];

interface Professor {
    id: string;
    name: string;
    teaching_rating: number;
    teaching_count: number;
    proctoring_rating: number;
    proctoring_count: number;
    top_tags: string[];
}

interface ProfessorPageClientProps {
    professor: Professor;
}

export function ProfessorPageClient({ professor }: ProfessorPageClientProps) {
    const router = useRouter();
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);

    // Calculate overall rating
    const overallRating = useMemo(() => {
        const ratings: number[] = [];
        if (professor.teaching_count > 0) ratings.push(professor.teaching_rating);
        if (professor.proctoring_count > 0) ratings.push(professor.proctoring_rating);
        if (ratings.length === 0) return 0;
        return ratings.reduce((a, b) => a + b, 0) / ratings.length;
    }, [professor]);

    const totalReviews = professor.teaching_count + professor.proctoring_count;

    // Schedule data lookup
    const scheduleInfo = useMemo(() => {
        let match = teachersData.find(
            t => t.teacherName.toLowerCase() === professor.name.toLowerCase()
        );
        if (!match) {
            match = teachersData.find(t => {
                const parts1 = t.teacherName.toLowerCase().split(/[ \-]/);
                const parts2 = professor.name.toLowerCase().split(/[ \-]/);
                const intersection = parts1.filter(p => parts2.includes(p));
                return intersection.length >= 2;
            });
        }
        if (!match) {
            match = teachersData.find(
                t => t.teacherName.toLowerCase().includes(professor.name.toLowerCase()) ||
                    professor.name.toLowerCase().includes(t.teacherName.toLowerCase())
            );
        }
        return match || null;
    }, [professor]);

    // Determine badge text
    const getBadge = () => {
        if (overallRating >= 4.5) return { text: "Student favorite", subtitle: "One of the most loved professors\nbased on ratings, reviews, and reliability" };
        if (overallRating >= 3.5) return { text: "Top rated", subtitle: "Highly rated by students\nbased on teaching and proctoring reviews" };
        if (overallRating >= 2.5) return { text: "Well reviewed", subtitle: "Positively reviewed by students\nbased on teaching and proctoring ratings" };
        return null;
    };

    const badge = getBadge();

    return (
        <div className="py-6 sm:py-12 px-4 sm:px-6 w-full">
            {/* Back button */}
            <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to all professors
            </button>

            {/* Professor name header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">
                    {professor.name}
                </h1>
                <ShareButton
                    professorId={professor.id}
                    professorName={professor.name}
                    showText
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                />
            </div>

            {/* Airbnb-style rating card */}
            <div className="rounded-2xl overflow-hidden mb-8">
                {/* Main score section */}
                {overallRating > 0 && (
                    <div className="flex flex-col items-center justify-center py-10 sm:py-14 px-4">
                        {/* Laurel + Score */}
                        <div className="flex items-center gap-2 sm:gap-3 mb-0">
                            {/* Left laurel */}
                            <svg width="36" height="72" viewBox="0 0 36 72" fill="none" className="text-gray-900 dark:text-white">
                                <path d="M18 4c-4 8-14 16-14 32s10 24 14 32" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <ellipse cx="10" cy="20" rx="5" ry="8" fill="currentColor" opacity="0.85" transform="rotate(-15 10 20)" />
                                <ellipse cx="6" cy="34" rx="5" ry="8" fill="currentColor" opacity="0.85" transform="rotate(-5 6 34)" />
                                <ellipse cx="8" cy="48" rx="5" ry="8" fill="currentColor" opacity="0.85" transform="rotate(10 8 48)" />
                                <ellipse cx="14" cy="58" rx="4" ry="6" fill="currentColor" opacity="0.7" transform="rotate(20 14 58)" />
                                <ellipse cx="14" cy="12" rx="4" ry="6" fill="currentColor" opacity="0.7" transform="rotate(-25 14 12)" />
                            </svg>

                            <span className="text-6xl sm:text-7xl font-bold text-gray-900 dark:text-white tabular-nums">
                                {overallRating.toFixed(2)}
                            </span>

                            {/* Right laurel (mirrored) */}
                            <svg width="36" height="72" viewBox="0 0 36 72" fill="none" className="text-gray-900 dark:text-white" style={{ transform: "scaleX(-1)" }}>
                                <path d="M18 4c-4 8-14 16-14 32s10 24 14 32" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <ellipse cx="10" cy="20" rx="5" ry="8" fill="currentColor" opacity="0.85" transform="rotate(-15 10 20)" />
                                <ellipse cx="6" cy="34" rx="5" ry="8" fill="currentColor" opacity="0.85" transform="rotate(-5 6 34)" />
                                <ellipse cx="8" cy="48" rx="5" ry="8" fill="currentColor" opacity="0.85" transform="rotate(10 8 48)" />
                                <ellipse cx="14" cy="58" rx="4" ry="6" fill="currentColor" opacity="0.7" transform="rotate(20 14 58)" />
                                <ellipse cx="14" cy="12" rx="4" ry="6" fill="currentColor" opacity="0.7" transform="rotate(-25 14 12)" />
                            </svg>
                        </div>

                        {/* Badge text */}
                        {badge && (
                            <div className="text-center">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
                                    {badge.text}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line leading-relaxed max-w-xs mx-auto">
                                    {badge.subtitle}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {overallRating === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 sm:py-14 px-4 text-center">
                        <span className="text-5xl sm:text-6xl font-bold text-gray-300 dark:text-gray-600 mb-3">—</span>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No ratings yet. Be the first to rate!</p>
                    </div>
                )}

                {/* Category breakdown */}
                <div className="flex justify-center gap-1 sm:gap-2">
                    {/* Teaching */}
                    <div className="px-6 py-5 sm:py-6 flex items-center gap-4">
                        <BookOpen size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Teaching</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                                    {professor.teaching_count > 0 ? Number(professor.teaching_rating).toFixed(1) : "—"}
                                </span>
                                <div className="flex flex-col">
                                    <StarRating rating={professor.teaching_rating} size={14} />
                                    <span className="text-xs text-gray-400 dark:text-gray-500">({professor.teaching_count})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Proctoring */}
                    <div className="px-6 py-5 sm:py-6 flex items-center gap-4">
                        <Shield size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Proctoring</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                                    {professor.proctoring_count > 0 ? Number(professor.proctoring_rating).toFixed(1) : "—"}
                                </span>
                                <div className="flex flex-col">
                                    <StarRating rating={professor.proctoring_rating} size={14} />
                                    <span className="text-xs text-gray-400 dark:text-gray-500">({professor.proctoring_count})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Professor Information List */}
            {((professor.top_tags && professor.top_tags.length > 0) || scheduleInfo) && (
                <div className="mb-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-8">Professor Information</h3>
                    <div className="flex flex-col gap-2 sm:gap-5">
                        {/* Tags */}
                        {professor.top_tags && professor.top_tags.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Tag size={18} className="text-gray-400 dark:text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Top Tags</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {professor.top_tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-6 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Schedule Information */}
                        {scheduleInfo && (
                            <>
                                {/* Disciplines */}
                                {scheduleInfo.disciplines.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <GraduationCap size={18} className="text-gray-400 dark:text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Disciplines</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {scheduleInfo.disciplines.map((disc, idx) => (
                                                <span key={idx} className="px-6 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                    {disc}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Groups */}
                                {scheduleInfo.groups.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Users size={18} className="text-gray-400 dark:text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Groups</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {scheduleInfo.groups.map((group, idx) => (
                                                <span key={idx} className="px-6 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                    {group}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Rate button */}
            <div className="mb-8">
                <button
                    onClick={() => setIsRateModalOpen(true)}
                    className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-xl font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                >
                    Rate this professor
                </button>
            </div>

            {/* Comments section — under construction banner */}
            <div className="pt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Comments</h3>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-8 text-center">
                    <span className="text-2xl mb-3 block">🚧</span>
                    <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">Under work</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Добавлю позже отвечаю))</p>
                </div>
            </div>

            {/* Rate Modal */}
            <RateModal
                professor={professor}
                isOpen={isRateModalOpen}
                onClose={() => setIsRateModalOpen(false)}
                onSuccess={() => {
                    window.location.reload();
                }}
            />
        </div>
    );
}
