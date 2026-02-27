import { createAdminClient } from "@/lib/supabase-server";
import teachersDataFile from "../../../teachers_data.json";
import { GroupPageClient } from "@/components/GroupPageClient";
import { Suspense } from "react";

export const revalidate = 60; // Cache for 60 seconds

export default async function GroupsPage() {
    const supabase = createAdminClient();
    const { data: professors, error } = await supabase.rpc(
        "get_professors_with_ratings"
    );

    const approvedProfessors = professors
        ? professors.filter((p: any) => p.is_approved !== false)
        : [];

    if (error) {
        console.error("Error fetching professors:", error);
        return <div>Error loading data</div>;
    }

    const teachersData = teachersDataFile as any[];

    // Extract unique groups from the JSON
    const allGroups = Array.from(
        new Set(
            teachersData.flatMap((teacher: any) => teacher.groups || [])
        )
    ).sort() as string[]; // Sort alphabetically

    return (
        <Suspense fallback={<div className="py-8 text-center text-gray-500">Loading groups...</div>}>
            <GroupPageClient
                allGroups={allGroups}
                teacherGroupMap={teachersData}
                approvedProfessors={approvedProfessors}
            />
        </Suspense>
    );
}
