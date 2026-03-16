import { LiveVisitorCount } from "./components/LiveVisitorCount";
import { createAdminClient } from "@/lib/supabase-server";
import dbConnect from "@/lib/mongodb";
import CommentModel from "@/models/Comment";
import RemovalRequest from "@/models/RemovalRequest";
import { BookOpen, Users, MessageSquare, AlertCircle, TrendingUp, ShieldAlert } from "lucide-react";
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
    // Fetch stats
    const admin = createAdminClient();

    // Total professors
    const { count: profCount } = await admin
        .from('professors')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);

    // Total ratings
    const { count: ratingCount } = await admin
        .from('ratings')
        .select('*', { count: 'exact', head: true });

    // Total comments (MongoDB)
    await dbConnect();
    const commentCount = await CommentModel.countDocuments({ status: 'approved' });
    const pendingCommentCount = await CommentModel.countDocuments({ status: 'pending' });
    const pendingRemovalCount = await RemovalRequest.countDocuments({ status: 'pending' });

    // Pending professors
    const { count: pendingProfCount } = await admin
        .from('professors')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);

    const totalPending = (pendingProfCount || 0) + pendingCommentCount + pendingRemovalCount;

    return (
        <div className="p-6 lg:p-10 w-full min-h-full">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[180px]">

                {/* 1. Pending Actions (Hero Card) */}
                <div className={`col-span-1 md:col-span-2 lg:col-span-2 row-span-2 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-all hover:scale-[1.01] ${totalPending > 0 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-teal-500/20'}`}>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-medium opacity-90 mb-1">Attention Needed</h2>
                            <p className="text-6xl font-black tracking-tighter">{totalPending}</p>
                            <p className="text-sm opacity-80 mt-2 font-medium">Pending items waiting for moderation</p>
                        </div>
                        <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-wrap gap-3 mt-8">
                        <Link href="/admin/teachers" className="flex-1 min-w-[120px] bg-black/20 hover:bg-black/30 backdrop-blur-md transition-colors rounded-xl p-4 flex flex-col gap-1 items-start relative overflow-hidden group">
                            <span className="text-3xl font-bold">{pendingProfCount || 0}</span>
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Teachers</span>
                            {pendingProfCount !== null && pendingProfCount > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse shadow-sm shadow-white/50" />}
                        </Link>

                        <Link href="/admin/comments" className="flex-1 min-w-[120px] bg-black/20 hover:bg-black/30 backdrop-blur-md transition-colors rounded-xl p-4 flex flex-col gap-1 items-start relative overflow-hidden group">
                            <span className="text-3xl font-bold">{pendingCommentCount}</span>
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Comments</span>
                            {pendingCommentCount > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse shadow-sm shadow-white/50" />}
                        </Link>

                        <Link href="/admin/requests" className="flex-1 min-w-[120px] bg-black/20 hover:bg-black/30 backdrop-blur-md transition-colors rounded-xl p-4 flex flex-col gap-1 items-start relative overflow-hidden group">
                            <span className="text-3xl font-bold">{pendingRemovalCount}</span>
                            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Removals</span>
                            {pendingRemovalCount > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse shadow-sm shadow-white/50" />}
                        </Link>
                    </div>
                    {/* Decorative background element */}
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                </div>

                {/* 2. Live Visitors Widget */}
                <LiveVisitorCount />

                {/* 3. Total Ratings */}
                <div className="col-span-1 border border-zinc-200 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between transition-all hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{ratingCount || 0}</p>
                        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mt-1">Total Ratings</p>
                    </div>
                </div>

                {/* 4. Total Comments */}
                <div className="col-span-1 border border-zinc-200 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between transition-all hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600 dark:text-purple-400">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{commentCount}</p>
                        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mt-1">Approved Comments</p>
                    </div>
                </div>

                {/* 5. Approved Professors */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 border border-zinc-200 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-3xl p-6 flex items-center gap-6 transition-all hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm overflow-hidden relative">
                    <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] text-emerald-600 dark:text-emerald-400 shrink-0 z-10">
                        <Users className="w-8 h-8" />
                    </div>
                    <div className="z-10">
                        <p className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">{profCount || 0}</p>
                        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mt-1">Approved Professors</p>
                    </div>
                    <div className="absolute -right-8 -top-8 text-zinc-100 dark:text-zinc-800/50 rotate-12 pointer-events-none">
                        <Users className="w-48 h-48" />
                    </div>
                </div>

            </div>
        </div>
    );
}
