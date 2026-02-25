import { ProfessorTable } from "@/components/ProfessorTable";
import { createAdminClient } from "@/lib/supabase-server";
import { Suspense } from "react";

export const revalidate = 60; // Cache for 60 seconds to prevent DoS via repeated page loads

export default async function Home() {
  const supabase = createAdminClient();
  const { data: professors, error } = await supabase.rpc(
    "get_professors_with_ratings"
  );

  const approvedProfessors = professors
    ? professors.filter((p: any) => p.is_approved !== false) // Show if true or undefined (legacy), hide if explicitly false
    : [];

  if (error) {
    console.error("Error fetching professors:", error);
    return <div>Error loading data</div>;
  }

  return (
    <div className="py-8 sm:py-16 px-4 sm:px-6 w-full ">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6 sm:mb-8 text-gray-900 dark:text-white tracking-tight">
          Professor Ratings
        </h1>
        <Suspense fallback={<div className="py-8 text-center text-gray-500">Loading professors...</div>}>
          <ProfessorTable initialProfessors={approvedProfessors} />
        </Suspense>
      </div>
    </div>
  );
}
