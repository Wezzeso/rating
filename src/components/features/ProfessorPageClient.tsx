"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, BookOpen, Shield, GraduationCap, Users, Tag, Send, Edit2, Trash2, X, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/ui/StarRating";
import { ShareButton } from "@/components/ui/ShareButton";
import { RateModal } from "@/components/modals/RateModal";
import teachersDataRaw from "../../../data/teachers_data.json";
import {
    submitComment,
    fetchApprovedComments,
    fetchUserComment,
    updateComment,
    deleteComment
} from "@/app/actions";
import { toast } from "sonner";

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

    // Comments State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [comments, setComments] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [userComment, setUserComment] = useState<any>(null);
    const [commentText, setCommentText] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [commentsLoading, setCommentsLoading] = useState(true);

    useEffect(() => {
        loadCommentsData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [professor.id]);

    const loadCommentsData = async () => {
        setCommentsLoading(true);
        const [approvedRes, userRes] = await Promise.all([
            fetchApprovedComments(professor.id),
            fetchUserComment(professor.id)
        ]);

        if (approvedRes.success && approvedRes.data) {
            setComments(approvedRes.data);
        }
        if (userRes.success && userRes.data) {
            setUserComment(userRes.data);
        }
        setCommentsLoading(false);
    };

    const handleCommentSubmit = async () => {
        if (!commentText.trim()) return;
        setIsSubmitting(true);

        if (isEditing && userComment) {
            const res = await updateComment({ commentId: userComment.id, text: commentText });
            if (res.success) {
                toast.success("Comment updated successfully (pending approval)");
                setIsEditing(false);
                setCommentText("");
                loadCommentsData();
            } else {
                toast.error(res.error || "Failed to edit comment");
            }
        } else {
            const res = await submitComment({ professorId: professor.id, text: commentText });
            if (res.success) {
                toast.success("Comment submitted successfully (pending approval)");
                setCommentText("");
                loadCommentsData();
            } else {
                toast.error(res.error || "Failed to submit comment");
            }
        }
        setIsSubmitting(false);
    };

    const handleDeleteComment = async () => {
        if (!userComment) return;
        if (!confirm("Are you sure you want to delete your comment?")) return;

        setIsSubmitting(true);
        const res = await deleteComment(userComment.id);
        if (res.success) {
            toast.success("Comment deleted");
            setUserComment(null);
            setCommentText("");
            setIsEditing(false);
            setComments(prev => prev.filter(c => c.id !== userComment.id));
        } else {
            toast.error(res.error || "Failed to delete comment");
        }
        setIsSubmitting(false);
    };

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

    const TAG_MARKS: Record<string, number> = {
        "Best teacher": 0.5,
        "Favourite teacher": 0.5,
        "+swag +rep": 0.4,
        "Chill vibes": 0.3,
        "Extra credit": 0.3,
        "Fair game": 0.1,
        "Tough but fair": 0.0,
        "Respect is key": 0.0,
        "Attendance is key": -0.1,
        "Participation matters": -0.1,
        "Hard grader": -0.2,
        "AI Strict": -0.2,
        "cringe": -0.3,
        "Pray for your Scholorship": -0.4,
        "Retake": -0.4,
        "You are cooked lil bro": -0.5,
        "Psychological Horror": -0.6,
    };

    const tagScore = useMemo(() => {
        if (!professor.top_tags) return 0;
        return professor.top_tags.reduce((sum, tag) => sum + (TAG_MARKS[tag] || 0), 0);
    }, [professor.top_tags]);

    // Determine badge text
    const getBadge = () => {
        if (overallRating === 0) return null;

        const effectiveRating = overallRating + tagScore;

        if (effectiveRating >= 5.5) return { text: "Transcendent", subtitle: "Beyond perfect. The community confirms they are a literal deity." };
        if (effectiveRating >= 5.3) return { text: "God Tier", subtitle: "Pinnacle of academia. Unbelievable rating boosted by godly tags." };
        if (effectiveRating >= 5.1) return { text: "Hall of Fame", subtitle: "A perfect 5.0 experience pushed even higher by immaculate vibes." };
        if (effectiveRating >= 5.0) return { text: "Flawless", subtitle: "Perfection. No red flags, only pure academic excellence." };
        if (effectiveRating >= 4.9) return { text: "Absolute Legend", subtitle: "Flawless. If you get them, consider yourself blessed." };
        if (effectiveRating >= 4.8) return { text: "S-Tier", subtitle: "Masterclass in teaching. Guaranteed W if you show up." };
        if (effectiveRating >= 4.7) return { text: "Rare W", subtitle: "A true gem. Classes are actually engaging and fun." };
        if (effectiveRating >= 4.6) return { text: "Goated", subtitle: "Incredible professor. Hard to get off the waitlist for a reason." };
        if (effectiveRating >= 4.5) return { text: "Elite Pick", subtitle: "Top tier. Makes complex topics feel like basic math." };
        if (effectiveRating >= 4.4) return { text: "Valid", subtitle: "Very solid pick. You won't regret having them on your schedule." };
        if (effectiveRating >= 4.3) return { text: "Based", subtitle: "Actually cares about students. Rare find these days." };
        if (effectiveRating >= 4.2) return { text: "W Professor", subtitle: "Good vibes and fair grading. Definitely recommend." };
        if (effectiveRating >= 4.1) return { text: "High Quality", subtitle: "Great lectures, clear expectations. Hard to complain." };
        if (effectiveRating >= 4.0) return { text: "Safe Bet", subtitle: "Reliable choice. Do the bare minimum and you'll be fine." };
        if (effectiveRating >= 3.9) return { text: "Solid", subtitle: "Nothing crazy, but gets the job done without extra stress." };
        if (effectiveRating >= 3.8) return { text: "Decent", subtitle: "Not mind-blowing but completely fine. A standard class." };
        if (effectiveRating >= 3.7) return { text: "Alright", subtitle: "Could be better, could definitely be worse." };
        if (effectiveRating >= 3.6) return { text: "Mid", subtitle: "Pretty average experience. Neither terrible nor amazing." };
        if (effectiveRating >= 3.5) return { text: "Neutral", subtitle: "You'll learn what you need to, but it won't be exciting." };
        if (effectiveRating >= 3.4) return { text: "Passable", subtitle: "You will survive, but do not expect to be inspired." };
        if (effectiveRating >= 3.3) return { text: "Boring but Fair", subtitle: "Lectures drag on, but the exams are exactly what was taught." };
        if (effectiveRating >= 3.2) return { text: "Sleep Fest", subtitle: "Lectures are a cure for insomnia, but the class is doable." };
        if (effectiveRating >= 3.1) return { text: "Needs Work", subtitle: "A bit disorganized. Expect some last-minute syllabus changes." };
        if (effectiveRating >= 3.0) return { text: "Self Study", subtitle: "You will be relying heavily on the textbook, YouTube and hopes." };
        if (effectiveRating >= 2.9) return { text: "Frustrating", subtitle: "You'll spend more time wondering what's due than actually doing it." };
        if (effectiveRating >= 2.8) return { text: "Tough Watch", subtitle: "Lectures are confusing. Get ready to essentially teach yourself." };
        if (effectiveRating >= 2.7) return { text: "Red Flag", subtitle: "Something feels off. Proceed with lowered expectations." };
        if (effectiveRating >= 2.6) return { text: "Questionable", subtitle: "Grading is a mystery and instructions are often unclear." };
        if (effectiveRating >= 2.5) return { text: "Coin Flip", subtitle: "Depends entirely on the day. Pure chaos." };
        if (effectiveRating >= 2.4) return { text: "Rough", subtitle: "Expect a heavy workload and little to no helpful guidance." };
        if (effectiveRating >= 2.3) return { text: "Survival Mode", subtitle: "It's not about learning anymore, it's about passing." };
        if (effectiveRating >= 2.2) return { text: "Cooked", subtitle: "Your GPA is in danger. Proceed with extreme caution." };
        if (effectiveRating >= 2.1) return { text: "Yikes", subtitle: "Just bad. You will regret registering for this." };
        if (effectiveRating >= 2.0) return { text: "Canon Event", subtitle: "Everyone has to suffer through this class at least once." };
        if (effectiveRating >= 1.9) return { text: "Tragic", subtitle: "A complete disaster from start to finish." };
        if (effectiveRating >= 1.8) return { text: "Avoid", subtitle: "Take literally anyone else if you have the option." };
        if (effectiveRating >= 1.7) return { text: "Nightmare", subtitle: "Waking up for this class will physically hurt." };
        if (effectiveRating >= 1.6) return { text: "GPA Assassin", subtitle: "Say goodbye to your academic comeback for this semester." };
        if (effectiveRating >= 1.5) return { text: "Final Boss", subtitle: "The hardest, most unfair class you will ever take." };
        if (effectiveRating >= 1.4) return { text: "Trench Work", subtitle: "Every assignment is a battle for your sanity and grades." };
        if (effectiveRating >= 1.3) return { text: "Beyond Saving", subtitle: "No curve can save you from this grading scale." };
        if (effectiveRating >= 1.2) return { text: "Unsalvageable", subtitle: "Abandon all hope ye who enter here. It is genuinely that bad." };
        if (effectiveRating >= 1.1) return { text: "Why?", subtitle: "Why would you do this to yourself?" };
        if (effectiveRating >= 0.8) return { text: "Run", subtitle: "Negative territory. Even the tags scream danger." };
        if (effectiveRating >= 0.5) return { text: "Hazardous", subtitle: "Your presence in this class is an actual health risk." };
        return { text: "Well...", subtitle: "I'm not sure what to say..." };
    };

    const badge = getBadge();

    return (
        <div className="py-6 sm:py-12 px-4 sm:px-6 w-full">
            {/* Back button */}
            <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to all professors
            </button>

            {/* Professor name header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
                    {professor.name}
                </h1>
                <ShareButton
                    professorId={professor.id}
                    professorName={professor.name}
                    showText
                    className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
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
                            <svg width="36" height="72" viewBox="0 0 36 72" fill="none" className="text-gray-900 dark:text-zinc-100">
                                <path d="M18 4c-4 8-14 16-14 32s10 24 14 32" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <ellipse cx="10" cy="20" rx="5" ry="8" fill="currentColor" opacity="0.85" transform="rotate(-15 10 20)" />
                                <ellipse cx="6" cy="34" rx="5" ry="8" fill="currentColor" opacity="0.85" transform="rotate(-5 6 34)" />
                                <ellipse cx="8" cy="48" rx="5" ry="8" fill="currentColor" opacity="0.85" transform="rotate(10 8 48)" />
                                <ellipse cx="14" cy="58" rx="4" ry="6" fill="currentColor" opacity="0.7" transform="rotate(20 14 58)" />
                                <ellipse cx="14" cy="12" rx="4" ry="6" fill="currentColor" opacity="0.7" transform="rotate(-25 14 12)" />
                            </svg>

                            <span className="text-6xl sm:text-7xl font-bold text-gray-900 dark:text-zinc-100 tabular-nums">
                                {overallRating.toFixed(2)}
                            </span>

                            {/* Right laurel (mirrored) */}
                            <svg width="36" height="72" viewBox="0 0 36 72" fill="none" className="text-gray-900 dark:text-zinc-100" style={{ transform: "scaleX(-1)" }}>
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
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                                    {badge.text}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-zinc-400 whitespace-pre-line leading-relaxed max-w-xs mx-auto">
                                    {badge.subtitle}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {overallRating === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 sm:py-14 px-4 text-center">
                        <span className="text-5xl sm:text-6xl font-bold text-gray-300 dark:text-zinc-600 mb-3">—</span>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm">No ratings yet. Be the first to rate!</p>
                    </div>
                )}

                {/* Category breakdown */}
                <div className="flex justify-center gap-1 sm:gap-2">
                    {/* Teaching */}
                    <div className="px-6 py-5 sm:py-6 flex items-center gap-4">
                        <BookOpen size={20} className="text-gray-400 dark:text-zinc-500 shrink-0" />
                        <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Teaching</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 tabular-nums">
                                    {professor.teaching_count > 0 ? Number(professor.teaching_rating).toFixed(1) : "—"}
                                </span>
                                <div className="flex flex-col">
                                    <StarRating rating={professor.teaching_rating} size={14} />
                                    <span className="text-xs text-gray-400 dark:text-zinc-500">({professor.teaching_count})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Proctoring */}
                    <div className="px-6 py-5 sm:py-6 flex items-center gap-4">
                        <Shield size={20} className="text-gray-400 dark:text-zinc-500 shrink-0" />
                        <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-zinc-100">Proctoring</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-zinc-100 tabular-nums">
                                    {professor.proctoring_count > 0 ? Number(professor.proctoring_rating).toFixed(1) : "—"}
                                </span>
                                <div className="flex flex-col">
                                    <StarRating rating={professor.proctoring_rating} size={14} />
                                    <span className="text-xs text-gray-400 dark:text-zinc-500">({professor.proctoring_count})</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Professor Information List */}
            {((professor.top_tags && professor.top_tags.length > 0) || scheduleInfo) && (
                <div className="mb-8 pt-8 border-t border-gray-100 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-8">Professor Information</h3>
                    <div className="flex flex-col gap-2 sm:gap-5">
                        {/* Tags */}
                        {professor.top_tags && professor.top_tags.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Tag size={18} className="text-gray-400 dark:text-zinc-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-zinc-100">Top Tags</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {professor.top_tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-6 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-100"
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
                                            <GraduationCap size={18} className="text-gray-400 dark:text-zinc-500" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-zinc-100">Disciplines</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {scheduleInfo.disciplines.map((disc, idx) => (
                                                <span key={idx} className="px-6 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-100">
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
                                            <Users size={18} className="text-gray-400 dark:text-zinc-500" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-zinc-100">Groups</span>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {scheduleInfo.groups.map((group, idx) => (
                                                <span key={idx} className="px-6 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-100">
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
                    className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3 rounded-xl font-medium text-sm hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors"
                    style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                >
                    Rate this professor
                </button>
            </div>

            {/* Comments section */}
            <div className="pt-8 mb-12">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-6">Comments</h3>

                {/* Comment Input */}
                <div className="bg-gray-50 dark:bg-zinc-900/40 rounded-2xl p-4 sm:p-6 mb-8 border border-gray-100 dark:border-zinc-800">
                    {userComment && !isEditing ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                    Your Comment
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${userComment.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                                        userComment.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                                            'bg-red-100 text-red-700 dark:bg-red-900/30'
                                        }`}>
                                        {userComment.status}
                                    </span>
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setCommentText(userComment.text);
                                            setIsEditing(true);
                                        }}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="Edit"
                                        disabled={isSubmitting}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={handleDeleteComment}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title="Delete"
                                        disabled={isSubmitting}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-800 dark:text-zinc-200">{userComment.text}</p>
                            {userComment.status === 'pending' && <p className="text-xs text-amber-600 dark:text-amber-500/80 mt-1">Pending review.</p>}
                            {userComment.status === 'rejected' && <p className="text-xs text-red-600 dark:text-red-500/80 mt-1">This comment was rejected and is not public.</p>}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {isEditing && (
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Editing your comment</span>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setCommentText("");
                                        }}
                                        className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-zinc-300 flex items-center gap-1"
                                    >
                                        <X size={14} /> Cancel
                                    </button>
                                </div>
                            )}
                            <div className="relative">
                                <textarea
                                    className="w-full bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-600 resize-none min-h-[100px]"
                                    placeholder="Write a comment about this professor..."
                                    maxLength={100}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    disabled={isSubmitting}
                                ></textarea>
                                <div className="absolute bottom-3 right-3 flex items-center gap-3">
                                    <span className={`text-xs ${commentText.length >= 100 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                        {commentText.length}/100
                                    </span>
                                    <button
                                        onClick={handleCommentSubmit}
                                        disabled={!commentText.trim() || isSubmitting}
                                        className="p-2 bg-black dark:bg-white text-white dark:text-zinc-900 rounded-lg disabled:opacity-50 hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors"
                                    >
                                        {isSubmitting ? <span className="px-1 text-xs">...</span> : <Send size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                    {commentsLoading ? (
                        <div className="py-8 text-center text-gray-400"><span className="animate-pulse">Loading comments...</span></div>
                    ) : comments.length > 0 ? (
                        comments.map((comment, index) => (
                            <div key={comment.id || index} className="pb-5 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                                <p className="text-gray-800 dark:text-zinc-200 text-sm leading-relaxed mb-2 break-words">
                                    "{comment.text}"
                                </p>
                                <span className="text-xs text-gray-400 dark:text-zinc-500">
                                    {new Date(comment.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 border border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-center flex flex-col items-center justify-center bg-gray-50/50 dark:bg-zinc-900/20">
                            <MessageSquare className="w-8 h-8 text-gray-300 dark:text-zinc-700 mb-3" />
                            <p className="text-gray-500 dark:text-zinc-400 text-sm">No comments yet. Be the first to share your thoughts!</p>
                        </div>
                    )}
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
