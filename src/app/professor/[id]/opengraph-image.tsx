import { ImageResponse } from 'next/og';
import { createAdminClient } from "@/lib/supabase-server";

export const runtime = 'edge';
export const alt = 'Professor Rating';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

export default async function Image(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;

    const supabase = createAdminClient();
    const { data: professors } = await supabase.rpc("get_professors_with_ratings");
    const professor = professors?.find((p: any) => p.id === id);

    if (!professor) {
        return new ImageResponse(
            (
                <div
                    style={{
                        background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1e293b',
                        fontSize: 48,
                    }}
                >
                    Professor Not Found
                </div>
            ),
            { ...size }
        );
    }

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '80px',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: 72, fontWeight: 'bold', color: '#0f172a', margin: 0, marginBottom: '10px' }}>
                        {professor.name}
                    </h1>
                    <p style={{ fontSize: 32, color: '#64748b', margin: 0 }}>
                        Teacher Ratings by Wezeso's Community
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '40px', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', background: 'white', padding: '30px', borderRadius: '16px', border: '2px solid #e2e8f0', flex: 1, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <span style={{ fontSize: 24, color: '#64748b', marginBottom: '10px', fontWeight: 500 }}>Teaching Rating</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <span style={{ fontSize: 64, fontWeight: 'bold', color: '#0f172a' }}>
                                {Number(professor.teaching_rating).toFixed(1)}
                            </span>
                            <span style={{ fontSize: 32, color: '#94a3b8' }}>/ 5</span>
                        </div>
                        <span style={{ fontSize: 20, color: '#94a3b8', marginTop: '10px' }}>
                            {professor.teaching_count} review{professor.teaching_count === 1 ? '' : 's'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', background: 'white', padding: '30px', borderRadius: '16px', border: '2px solid #e2e8f0', flex: 1, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                        <span style={{ fontSize: 24, color: '#64748b', marginBottom: '10px', fontWeight: 500 }}>Proctoring Rating</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            <span style={{ fontSize: 64, fontWeight: 'bold', color: '#0f172a' }}>
                                {Number(professor.proctoring_rating).toFixed(1)}
                            </span>
                            <span style={{ fontSize: 32, color: '#94a3b8' }}>/ 5</span>
                        </div>
                        <span style={{ fontSize: 20, color: '#94a3b8', marginTop: '10px' }}>
                            {professor.proctoring_count} review{professor.proctoring_count === 1 ? '' : 's'}
                        </span>
                    </div>
                </div>

                {professor.top_tags && professor.top_tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                        {professor.top_tags.map((tag: string) => (
                            <div
                                key={tag}
                                style={{
                                    padding: '12px 24px',
                                    background: '#f1f5f9',
                                    color: '#334155',
                                    borderRadius: '12px',
                                    fontSize: 22,
                                    fontWeight: 500,
                                    border: '1px solid #e2e8f0'
                                }}
                            >
                                {tag}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ),
        { ...size }
    );
}
