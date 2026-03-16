"use client";

import { useState, useEffect } from "react";
import { 
    Calendar, 
    Mail, 
    User, 
    MessageSquare, 
    CheckCircle2, 
    Clock, 
    ExternalLink,
    ShieldAlert,
    Inbox,
    Loader2
} from "lucide-react";
import { fetchRemovalRequests, updateRemovalRequestStatus } from "@/app/actions/removal";
import { toast } from "sonner";

interface RemovalRequestData {
    _id: string;
    professorName: string;
    officialEmail: string;
    reason: string;
    status: 'pending' | 'reviewed' | 'resolved';
    acceptedTerms: boolean;
    createdAt: string;
}

export default function RemovalRequestsPage() {
    const [requests, setRequests] = useState<RemovalRequestData[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const res = await fetchRemovalRequests();
            if (res.success) {
                setRequests(res.data);
            } else {
                toast.error(res.error || "Failed to fetch requests");
            }
            setLoading(false);
        };
        load();
    }, []);

    const handleStatusUpdate = async (id: string, newStatus: 'pending' | 'reviewed' | 'resolved') => {
        setUpdatingId(id);
        try {
            const res = await updateRemovalRequestStatus(id, newStatus);
            if (res.success) {
                setRequests(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
                toast.success(`Status updated to ${newStatus}`);
            } else {
                toast.error(res.error || "Failed to update status");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-zinc-400 font-medium">Loading requests...</p>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 w-full min-h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Removal Requests</h1>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                        Review requests from professors to remove their profiles.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium">
                    <ShieldAlert size={16} />
                    {requests.length} Total Requests
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-[2.5rem] bg-gray-50/50 dark:bg-zinc-900/20">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                        <Inbox size={32} />
                    </div>
                    <p className="text-gray-500 dark:text-zinc-400 font-medium">No removal requests found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => (
                        <div 
                            key={request._id}
                            className="group bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] p-6 transition-all hover:border-gray-200 dark:hover:border-zinc-700 hover:shadow-xl hover:shadow-gray-900/5 dark:hover:shadow-black/20"
                        >
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Info Section */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-gray-900 dark:text-white">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">{request.professorName}</h3>
                                                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                                    <Mail size={12} />
                                                    {request.officialEmail}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                            request.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            request.status === 'reviewed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                            {request.status === 'pending' ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                                            {request.status}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-zinc-950/50 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800/50">
                                        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                            <MessageSquare size={12} />
                                            Reason
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed italic">
                                            "{request.reason}"
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                        {request.acceptedTerms && (
                                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-medium">
                                                <CheckCircle2 size={12} />
                                                Terms Accepted
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action Section */}
                                <div className="flex lg:flex-col justify-end gap-2 lg:min-w-[160px]">
                                    <select
                                        value={request.status}
                                        disabled={updatingId === request._id}
                                        onChange={(e) => handleStatusUpdate(request._id, e.target.value as any)}
                                        className="px-4 py-2 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="reviewed">Reviewed</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                    
                                    <button 
                                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        onClick={() => {
                                            toast.info("Profile deletion is currently a manual process.", {
                                                description: "Please use the Supabase dashboard to remove the professor from the 'professors' table."
                                            });
                                        }}
                                    >
                                        <ExternalLink size={14} />
                                        Action Required
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
