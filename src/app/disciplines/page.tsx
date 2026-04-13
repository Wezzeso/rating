import { Suspense } from "react";
import { fetchUserRatedProfessorIds } from "@/app/actions";
import { DisciplinePageClient } from "@/components/features/DisciplinePageClient";
import { createAdminClient, createServerComponentClient } from "@/lib/supabase-server";
import teachersData1 from "../../../data/teachers_data_1st_trim.json";
import teachersData2 from "../../../data/teachers_data_2nd _trim.json";
import teachersData3 from "../../../data/teachers_data.json";
import { getProfessorScheduleInfo, TeacherScheduleEntry } from "@/lib/teacherSchedule";

export const revalidate = 60;

export const metadata = {
    title: "Browse by Discipline | Teacher Rating",
    description: "Find professors by discipline and explore their ratings.",
};

export default async function DisciplinesPage() {
    const supabaseAdmin = createAdminClient();
    const { data: professors, error } = await supabaseAdmin.rpc(
        "get_professors_with_ratings"
    );

    const allTeacherData = [
        ...(teachersData1 as TeacherScheduleEntry[]),
        ...(teachersData2 as TeacherScheduleEntry[]),
        ...(teachersData3 as TeacherScheduleEntry[]),
    ];

    const approvedProfessors = professors
        ? professors
            .filter((professor: any) => professor.is_approved !== false)
            .map((professor: any) => ({
                ...professor,
                disciplines: getProfessorScheduleInfo(
                    professor.name,
                    allTeacherData
                ).disciplines,
            }))
        : [];

    if (error) {
        console.error("Error fetching professors:", error);
        return <div>Error loading data</div>;
    }

    const supabase = await createServerComponentClient();
    const {
        data: { session },
    } = await supabase.auth.getSession();

    let ratedProfessorIds: string[] = [];
    if (session) {
        const ratedRes = await fetchUserRatedProfessorIds();
        if (ratedRes.success && ratedRes.data) {
            ratedProfessorIds = ratedRes.data;
        }
    }

    return (
        <Suspense
            fallback={
                <div className="py-8 text-center text-gray-500">
                    Loading disciplines...
                </div>
            }
        >
            <DisciplinePageClient
                professors={approvedProfessors}
                ratedProfessorIds={ratedProfessorIds}
            />
        </Suspense>
    );
}
