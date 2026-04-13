import { ProfessorTable } from "@/components/features/ProfessorTable";
import { createAdminClient, createServerComponentClient } from "@/lib/supabase-server";
import { Suspense } from "react";
import Link from "next/link";
import { GraduationCap, MessageSquarePlus } from "lucide-react";
import { fetchUserRatedProfessorIds } from "@/app/actions";

export const revalidate = 60; // Cache for 60 seconds to prevent DoS via repeated page loads

export const metadata = {
  title: "All Professors | Teacher Rating",
  description: "Browse and search for professors to read and write ratings.",
};

export default async function ProfessorsPage() {
  const supabaseAdmin = createAdminClient();
  const { data: professors, error } = await supabaseAdmin.rpc(
    "get_professors_with_ratings"
  );

  const approvedProfessors = professors
    ? professors.filter((p: any) => p.is_approved !== false) // Show if true or undefined (legacy), hide if explicitly false
    : [];

  if (error) {
    console.error("Error fetching professors:", error);
    return <div>Error loading data</div>;
  }

  // Check auth status for conditional footer
  const supabase = await createServerComponentClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Fetch rated professors for the current user
  let ratedProfessorIds: string[] = [];
  if (session) {
    const ratedRes = await fetchUserRatedProfessorIds();
    if (ratedRes.success && ratedRes.data) {
      ratedProfessorIds = ratedRes.data;
    }
  }

  return (
    <div className="py-8 sm:py-16 px-4 sm:px-6 w-full max-w-5xl mx-auto">
      <div className="w-full">
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-zinc-100 tracking-tight">
              Professor Ratings
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400 max-w-2xl">
              Search every approved professor, or jump to a dedicated discipline page to browse by subject.
            </p>
          </div>
          <Link
            href="/disciplines"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-zinc-100 hover:text-gray-900 dark:hover:text-zinc-100 border border-gray-200 dark:border-zinc-800 rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <GraduationCap size={16} />
            Browse by Discipline
          </Link>
        </div>
        <Suspense fallback={<div className="py-8 text-center text-gray-500">Loading professors...</div>}>
          <ProfessorTable initialProfessors={approvedProfessors} ratedProfessorIds={ratedProfessorIds} />
        </Suspense>

        {session && (
          <div className="mt-16 pt-8 border-t border-gray-100 dark:border-zinc-800">
            <div className="bg-blue-50/30 dark:bg-blue-900/10 rounded-3xl p-8 border border-blue-100/50 dark:border-blue-900/20 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Got Suggestions?</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md">
                  Is there a professor missing from the list? Or maybe you have an idea to make the platform better?
                </p>
              </div>
              <Link 
                href="/suggestions"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 rounded-2xl text-sm font-semibold text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20"
              >
                <MessageSquarePlus size={16} />
                Share Feedback
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
