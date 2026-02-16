import { ProfessorTable } from "@/components/ProfessorTable";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const revalidate = 60; // Cache for 60 seconds to prevent DoS via repeated page loads

export default async function Home() {
  const supabase = await createServerSupabaseClient();
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
    <main className="min-h-screen py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8 text-gray-900 tracking-tight">
          Professor Ratings
        </h1>
        <ProfessorTable initialProfessors={approvedProfessors} />
      </div>
    </main>
  );
}
