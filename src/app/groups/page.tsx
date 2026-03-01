import { createAdminClient } from "@/lib/supabase-server";
import teachersData1 from "../../../teachers_data_1st_trim.json";
import teachersData2 from "../../../teachers_data_2nd _trim.json";
import teachersData3 from "../../../teachers_data.json";
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

    const t1Data = teachersData1 as any[];
    const t2Data = teachersData2 as any[];
    const t3Data = teachersData3 as any[];

    // Extract unique groups from the JSONs
    const t1Groups = Array.from(
        new Set(t1Data.flatMap((teacher: any) => teacher.groups || []))
    ).sort() as string[];

    const t2Groups = Array.from(
        new Set(t2Data.flatMap((teacher: any) => teacher.groups || []))
    ).sort() as string[];

    const t3Groups = Array.from(
        new Set(t3Data.flatMap((teacher: any) => teacher.groups || []))
    ).sort() as string[];

    return (
        <Suspense fallback={<div className="py-8 text-center text-gray-500">Loading groups...</div>}>
            <GroupPageClient
                trimestersData={{
                    "1": t1Data,
                    "2": t2Data,
                    "3": t3Data,
                }}
                trimestersGroups={{
                    "1": t1Groups,
                    "2": t2Groups,
                    "3": t3Groups,
                }}
                approvedProfessors={approvedProfessors}
            />
        </Suspense>
    );
}
