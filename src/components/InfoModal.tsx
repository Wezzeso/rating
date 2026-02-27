"use client";

import { X, Star } from "lucide-react";
import teachersDataRaw from "../../teachers_data.json";
import { useMemo } from "react";
import { StarRating } from "@/components/ui/StarRating";

// The shape of our schedule data
interface ScheduleData {
    teacherName: string;
    disciplines: string[];
    groups: string[];
}

const teachersData = teachersDataRaw as ScheduleData[];

interface InfoModalProps {
    professor: {
        id: string;
        name: string;
        teaching_rating: number;
        teaching_count: number;
        proctoring_rating: number;
        proctoring_count: number;
        top_tags: string[];
    };
    isOpen: boolean;
    onClose: () => void;
}

export function InfoModal({ professor, isOpen, onClose }: InfoModalProps) {
    const scheduleInfo = useMemo(() => {
        if (!professor) return null;

        // Try strict match first
        let match = teachersData.find(
            t => t.teacherName.toLowerCase() === professor.name.toLowerCase()
        );

        // If not found, try a more relaxed match (e.g. "Smith, John" vs "John Smith", or partial name)
        if (!match) {
            match = teachersData.find(t => {
                const parts1 = t.teacherName.toLowerCase().split(/[ \-]/);
                const parts2 = professor.name.toLowerCase().split(/[ \-]/);
                // Check if they share at least two parts (first and last name)
                const intersection = parts1.filter(p => parts2.includes(p));
                return intersection.length >= 2;
            });
        }

        // Third fallback: one name completely includes the other
        if (!match) {
            match = teachersData.find(
                t => t.teacherName.toLowerCase().includes(professor.name.toLowerCase()) ||
                    professor.name.toLowerCase().includes(t.teacherName.toLowerCase())
            );
        }

        return match || null;
    }, [professor]);

    if (!isOpen) return null;

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
                    className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 pr-8">
                    {professor.name}
                </h2>
                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Teaching:</span>
                        <div className="flex items-center gap-2">
                            <StarRating rating={professor.teaching_rating} />
                            <span className="text-xs text-gray-400 dark:text-gray-500">({professor.teaching_count} ratings)</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Proctoring:</span>
                        <div className="flex items-center gap-2">
                            <StarRating rating={professor.proctoring_rating} />
                            <span className="text-xs text-gray-400 dark:text-gray-500">({professor.proctoring_count} ratings)</span>
                        </div>
                    </div>
                    {professor.top_tags && professor.top_tags.length > 0 && (
                        <div className="mt-2">
                            <span className="block text-gray-500 dark:text-gray-400 text-sm font-medium mb-1.5">Top Tags:</span>
                            <div className="flex flex-wrap gap-1.5">
                                {professor.top_tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md text-[10px] sm:text-xs border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h3 className="text-gray-900 dark:text-gray-100 font-medium text-lg mb-4">Schedule Information</h3>
                    {scheduleInfo ? (
                        <>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Disciplines
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {scheduleInfo.disciplines.map((disc, idx) => (
                                        <span key={idx} className="px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs border border-gray-200 dark:border-gray-700">
                                            {disc}
                                        </span>
                                    ))}
                                    {scheduleInfo.disciplines.length === 0 && (
                                        <span className="text-sm text-gray-400 italic">None listed</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4 sm:mt-0">
                                    Groups
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {scheduleInfo.groups.map((group, idx) => (
                                        <span key={idx} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-transparent text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
                                            {group}
                                        </span>
                                    ))}
                                    {scheduleInfo.groups.length === 0 && (
                                        <span className="text-sm text-gray-400 italic">None listed</span>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                            <p>No specific schedule data found for this professor.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
