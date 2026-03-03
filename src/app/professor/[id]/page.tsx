import { createAdminClient } from "@/lib/supabase-server";
import { ProfessorPageClient } from "@/components/features/ProfessorPageClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
    const params = await props.params;
    const supabase = createAdminClient();
    const { data: professors } = await supabase.rpc("get_professors_with_ratings");
    const professor = professors?.find((p: any) => p.id === params.id);

    if (!professor) {
        return { title: "Professor Not Found" };
    }

    return {
        title: `${professor.name} — Professor Ratings`,
        description: `View teaching and proctoring ratings for ${professor.name} on Wezeso.`,
    };
}

export default async function ProfessorPage(props: PageProps) {
    const params = await props.params;
    const supabase = createAdminClient();
    const { data: professors } = await supabase.rpc("get_professors_with_ratings");
    const professor = professors?.find((p: any) => p.id === params.id);

    if (!professor) {
        notFound();
    }

    return (
        <ProfessorPageClient
            professor={{
                id: professor.id,
                name: professor.name,
                teaching_rating: professor.teaching_rating,
                teaching_count: professor.teaching_count,
                proctoring_rating: professor.proctoring_rating,
                proctoring_count: professor.proctoring_count,
                top_tags: professor.top_tags || [],
            }}
        />
    );
}
