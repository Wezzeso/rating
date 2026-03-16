"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Check,
    X,
    RefreshCw,
    Loader2,
    Bot,
    AlertTriangle,
    Shield,
    MessageSquare
} from "lucide-react";
import {
    fetchPendingComments,
    approveComment,
    rejectComment,
    autoModerateComment
} from "@/app/actions/moderation";

interface PendingComment {
    id: string;
    professorId: string;
    text: string;
    status: string;
    createdAt: string;
    userEmail?: string;
    userFingerprint?: string;
}

export default function CommentsModerationPage() {
    const [comments, setComments] = useState<PendingComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [modLoading, setModLoading] = useState<Record<string, boolean>>({});
    const [isAutoModeratingAll, setIsAutoModeratingAll] = useState(false);

    useEffect(() => {
        loadComments();
    }, []);

    const loadComments = async () => {
        setLoading(true);
        const result = await fetchPendingComments();
        if (result.success && result.data) {
            setComments(result.data);
        } else {
            toast.error(result.error || "Failed to fetch comments");
        }
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        setModLoading(p => ({ ...p, [id]: true }));
        const res = await approveComment(id);
        if (res.success) {
            toast.success("Comment approved");
            setComments(prev => prev.filter(c => c.id !== id));
        } else {
            toast.error(res.error || "Failed to approve");
        }
        setModLoading(p => ({ ...p, [id]: false }));
    };

    const handleReject = async (id: string) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;
        setModLoading(p => ({ ...p, [id]: true }));
        const res = await rejectComment(id);
        if (res.success) {
            toast.success("Comment rejected");
            setComments(prev => prev.filter(c => c.id !== id));
        } else {
            toast.error(res.error || "Failed to reject");
        }
        setModLoading(p => ({ ...p, [id]: false }));
    };

    const handleAutoModerate = async (id: string, text: string) => {
        setModLoading(p => ({ ...p, [id]: true }));
        const res = await autoModerateComment(id, text);
        if (res.success) {
            // we don't toast per comment in bulk mode to avoid a mess
            setComments(prev => prev.filter(c => c.id !== id));
        } else {
            console.error(`AI Moderation failed for ${id}`);
        }
        setModLoading(p => ({ ...p, [id]: false }));
    };

    const handleAutoModerateAll = async () => {
        if (!comments.length) return;
        if (!confirm(`Are you sure you want to AI-Moderate all ${comments.length} pending comments?`)) return;

        setIsAutoModeratingAll(true);
        let approvedCount = 0;
        let rejectedCount = 0;
        let failedCount = 0;

        for (const comment of comments) {
            setModLoading(p => ({ ...p, [comment.id]: true }));
            const res = await autoModerateComment(comment.id, comment.text);
            if (res.success) {
                if (res.action === 'approve') approvedCount++;
                if (res.action === 'reject') rejectedCount++;
                setComments(prev => prev.filter(c => c.id !== comment.id));
            } else {
                failedCount++;
            }
            setModLoading(p => ({ ...p, [comment.id]: false }));
        }

        setIsAutoModeratingAll(false);
        toast.success(`Batch complete: ${approvedCount} approved, ${rejectedCount} rejected, ${failedCount} failed.`);
    };

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="py-6 px-4 md:px-8 max-w-7xl mx-auto min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">Comment Moderation</h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Review, approve, or reject user comments before they are public.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    {comments.length > 0 && (
                        <button
                            onClick={handleAutoModerateAll}
                            disabled={isAutoModeratingAll}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50"
                            title="Use Gemini AI to analyze and moderate ALL pending comments"
                        >
                            {isAutoModeratingAll ? <Loader2 size={18} className="animate-spin" /> : <Bot size={18} />}
                            <span>Auto-Moderate All</span>
                        </button>
                    )}
                    <button
                        onClick={loadComments}
                        disabled={isAutoModeratingAll}
                        className="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/80 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center"
                        title="Refresh list"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-xl rounded-3xl shadow-sm border border-gray-200/60 dark:border-zinc-800/60 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/60">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <MessageSquare size={18} />
                        </div>
                        <h2 className="font-bold text-gray-900 dark:text-white tracking-tight text-lg">
                            Pending Review <span className="ml-2 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-sm font-semibold text-gray-600 dark:text-zinc-400">{comments.length}</span>
                        </h2>
                    </div>
                </div>

                {comments.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-emerald-100 dark:border-emerald-900/30">
                            <Shield size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Пусто блен</h3>
                        <p className="text-gray-500 dark:text-zinc-400 max-w-sm font-medium">Тут пока что ниче нет, но скоро будет</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                        {comments.map((comment) => (
                            <div key={comment.id} className="p-6 md:p-8 flex flex-col lg:flex-row gap-6 lg:items-center hover:bg-white/80 dark:hover:bg-zinc-800/40 transition-colors">
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <p className="text-xl font-medium text-gray-900 dark:text-zinc-100 leading-relaxed">
                                            "{comment.text}"
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                                        <span className="text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700/50 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-blue-400"></span> Prof: {comment.professorId?.slice(0, 8) || "Unknown"}...
                                        </span>
                                        <span className="text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700/50 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-purple-400"></span> User: {comment.userFingerprint?.slice(0, 8) || "Unknown"}...
                                        </span>
                                        {comment.userEmail && (
                                            <span className="text-gray-600 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800/80 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700/50 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {comment.userEmail}
                                            </span>
                                        )}
                                        <span className="text-gray-400 dark:text-zinc-500 ml-1">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 shrink-0 pt-4 lg:pt-0 border-t border-gray-100 dark:border-zinc-800/60 lg:border-0 w-full lg:w-auto">
                                    <button
                                        disabled={modLoading[comment.id]}
                                        onClick={() => handleApprove(comment.id)}
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50"
                                    >
                                        <Check size={18} />
                                        <span>Approve</span>
                                    </button>
                                    <button
                                        disabled={modLoading[comment.id]}
                                        onClick={() => handleReject(comment.id)}
                                        className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50"
                                    >
                                        <X size={18} />
                                        <span>Reject</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
