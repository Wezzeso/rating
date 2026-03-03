import { ImageResponse } from 'next/og';
import { createAdminClient } from "@/lib/supabase-server";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const alt = 'Professor Rating';
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = 'image/png';

const TAG_MARKS: Record<string, number> = {
    "Best teacher": 0.5,
    "Favourite teacher": 0.5,
    "+swag +rep": 0.4,
    "Chill vibes": 0.3,
    "Extra credit": 0.3,
    "Fair game": 0.1,
    "Tough but fair": 0.0,
    "Respect is key": 0.0,
    "Attendance is key": -0.1,
    "Participation matters": -0.1,
    "Hard grader": -0.2,
    "AI Strict": -0.2,
    "cringe": -0.3,
    "Pray for your Scholorship": -0.4,
    "Retake": -0.4,
    "You are cooked lil bro": -0.5,
    "Psychological Horror": -0.6,
};

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

    const teachingRating = Number(professor.teaching_rating) || 0;
    const proctoringRating = Number(professor.proctoring_rating) || 0;
    const teachingCount = Number(professor.teaching_count) || 0;
    const proctoringCount = Number(professor.proctoring_count) || 0;

    const ratings: number[] = [];
    if (teachingCount > 0) ratings.push(teachingRating);
    if (proctoringCount > 0) ratings.push(proctoringRating);
    const overallRating = ratings.length === 0 ? 0 : ratings.reduce((a, b) => a + b, 0) / ratings.length;

    const topTags = professor.top_tags || [];
    const tagScore = topTags.reduce((sum: number, tag: string) => sum + (TAG_MARKS[tag] || 0), 0);
    const effectiveRating = overallRating + tagScore;

    const getBadge = (rating: number, effective: number) => {
        if (rating === 0) return null;
        if (effective >= 5.5) return { text: "Transcendent", subtitle: "Beyond perfect. The community confirms they are a literal deity." };
        if (effective >= 5.3) return { text: "God Tier", subtitle: "Pinnacle of academia. Unbelievable rating boosted by godly tags." };
        if (effective >= 5.1) return { text: "Hall of Fame", subtitle: "A perfect 5.0 experience pushed even higher by immaculate vibes." };
        if (effective >= 5.0) return { text: "Flawless", subtitle: "Perfection. No red flags, only pure academic excellence." };
        if (effective >= 4.9) return { text: "Absolute Legend", subtitle: "Flawless. If you get them, consider yourself blessed." };
        if (effective >= 4.8) return { text: "S-Tier", subtitle: "Masterclass in teaching. Guaranteed W if you show up." };
        if (effective >= 4.7) return { text: "Rare W", subtitle: "A true gem. Classes are actually engaging and fun." };
        if (effective >= 4.6) return { text: "Goated", subtitle: "Incredible professor. Hard to get off the waitlist for a reason." };
        if (effective >= 4.5) return { text: "Elite Pick", subtitle: "Top tier. Makes complex topics feel like basic math." };
        if (effective >= 4.4) return { text: "Valid", subtitle: "Very solid pick. You won't regret having them on your schedule." };
        if (effective >= 4.3) return { text: "Based", subtitle: "Actually cares about students. Rare find these days." };
        if (effective >= 4.2) return { text: "W Professor", subtitle: "Good vibes and fair grading. Definitely recommend." };
        if (effective >= 4.1) return { text: "High Quality", subtitle: "Great lectures, clear expectations. Hard to complain." };
        if (effective >= 4.0) return { text: "Safe Bet", subtitle: "Reliable choice. Do the bare minimum and you'll be fine." };
        if (effective >= 3.9) return { text: "Solid", subtitle: "Nothing crazy, but gets the job done without extra stress." };
        if (effective >= 3.8) return { text: "Decent", subtitle: "Not mind-blowing but completely fine. A standard class." };
        if (effective >= 3.7) return { text: "Alright", subtitle: "Could be better, could definitely be worse." };
        if (effective >= 3.6) return { text: "Mid", subtitle: "Pretty average experience. Neither terrible nor amazing." };
        if (effective >= 3.5) return { text: "Neutral", subtitle: "You'll learn what you need to, but it won't be exciting." };
        if (effective >= 3.4) return { text: "Passable", subtitle: "You will survive, but do not expect to be inspired." };
        if (effective >= 3.3) return { text: "Boring but Fair", subtitle: "Lectures drag on, but the exams are exactly what was taught." };
        if (effective >= 3.2) return { text: "Sleep Fest", subtitle: "Lectures are a cure for insomnia, but the class is doable." };
        if (effective >= 3.1) return { text: "Needs Work", subtitle: "A bit disorganized. Expect some last-minute syllabus changes." };
        if (effective >= 3.0) return { text: "Self Study", subtitle: "You will be relying heavily on the textbook, YouTube and hopes." };
        if (effective >= 2.9) return { text: "Frustrating", subtitle: "You'll spend more time wondering what's due than actually doing it." };
        if (effective >= 2.8) return { text: "Tough Watch", subtitle: "Lectures are confusing. Get ready to essentially teach yourself." };
        if (effective >= 2.7) return { text: "Red Flag", subtitle: "Something feels off. Proceed with lowered expectations." };
        if (effective >= 2.6) return { text: "Questionable", subtitle: "Grading is a mystery and instructions are often unclear." };
        if (effective >= 2.5) return { text: "Coin Flip", subtitle: "Depends entirely on the day. Pure chaos." };
        if (effective >= 2.4) return { text: "Rough", subtitle: "Expect a heavy workload and little to no helpful guidance." };
        if (effective >= 2.3) return { text: "Survival Mode", subtitle: "It's not about learning anymore, it's about passing." };
        if (effective >= 2.2) return { text: "Cooked", subtitle: "Your GPA is in danger. Proceed with extreme caution." };
        if (effective >= 2.1) return { text: "Yikes", subtitle: "Just bad. You will regret registering for this." };
        if (effective >= 2.0) return { text: "Canon Event", subtitle: "Everyone has to suffer through this class at least once." };
        if (effective >= 1.9) return { text: "Tragic", subtitle: "A complete disaster from start to finish." };
        if (effective >= 1.8) return { text: "Avoid", subtitle: "Take literally anyone else if you have the option." };
        if (effective >= 1.7) return { text: "Nightmare", subtitle: "Waking up for this class will physically hurt." };
        if (effective >= 1.6) return { text: "GPA Assassin", subtitle: "Say goodbye to your academic comeback for this semester." };
        if (effective >= 1.5) return { text: "Final Boss", subtitle: "The hardest, most unfair class you will ever take." };
        if (effective >= 1.4) return { text: "Trench Work", subtitle: "Every assignment is a battle for your sanity and grades." };
        if (effective >= 1.3) return { text: "Beyond Saving", subtitle: "No curve can save you from this grading scale." };
        if (effective >= 1.2) return { text: "Unsalvageable", subtitle: "Abandon all hope ye who enter here. It is genuinely that bad." };
        if (effective >= 1.1) return { text: "Why?", subtitle: "Why would you do this to yourself?" };
        if (effective >= 0.8) return { text: "Run", subtitle: "Negative territory. Even the tags scream danger." };
        if (effective >= 0.5) return { text: "Hazardous", subtitle: "Your presence in this class is an actual health risk." };
        if (effective >= 0.0) return { text: "No rating", subtitle: "No rating yet. Be the first to rate this professor." };
        return { text: "Well...", subtitle: "I'm not sure what to say..." };
    };

    const badge = getBadge(overallRating, effectiveRating);

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
                    alignItems: 'center',
                    padding: '40px',
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: 56, fontWeight: 'bold', color: '#0f172a', margin: 0, marginBottom: '6px', textAlign: 'center' }}>
                        {professor.name}
                    </h1>
                    <p style={{ fontSize: 24, color: '#64748b', margin: 0, textAlign: 'center' }}>
                        Teacher Ratings by Wezeso's Community
                    </p>
                </div>

                {overallRating > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '32px 64px', borderRadius: '32px', border: '2px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                            {/* Left laurel */}
                            <svg width="48" height="96" viewBox="0 0 72 144" fill="none" style={{ color: '#0f172a' }}>
                                <path d="M36 8c-8 16-28 32-28 64s20 48 28 64" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
                                <ellipse cx="20" cy="40" rx="10" ry="16" fill="currentColor" opacity="0.85" transform="rotate(-15 20 40)" />
                                <ellipse cx="12" cy="68" rx="10" ry="16" fill="currentColor" opacity="0.85" transform="rotate(-5 12 68)" />
                                <ellipse cx="16" cy="96" rx="10" ry="16" fill="currentColor" opacity="0.85" transform="rotate(10 16 96)" />
                                <ellipse cx="28" cy="116" rx="8" ry="12" fill="currentColor" opacity="0.7" transform="rotate(20 28 116)" />
                                <ellipse cx="28" cy="24" rx="8" ry="12" fill="currentColor" opacity="0.7" transform="rotate(-25 28 24)" />
                            </svg>

                            <span style={{ fontSize: 100, fontWeight: 'bold', color: '#0f172a', lineHeight: 1 }}>
                                {overallRating.toFixed(2)}
                            </span>

                            {/* Right laurel */}
                            <div style={{ display: 'flex', transform: 'scaleX(-1)' }}>
                                <svg width="48" height="96" viewBox="0 0 72 144" fill="none" style={{ color: '#0f172a' }}>
                                    <path d="M36 8c-8 16-28 32-28 64s20 48 28 64" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
                                    <ellipse cx="20" cy="40" rx="10" ry="16" fill="currentColor" opacity="0.85" transform="rotate(-15 20 40)" />
                                    <ellipse cx="12" cy="68" rx="10" ry="16" fill="currentColor" opacity="0.85" transform="rotate(-5 12 68)" />
                                    <ellipse cx="16" cy="96" rx="10" ry="16" fill="currentColor" opacity="0.85" transform="rotate(10 16 96)" />
                                    <ellipse cx="28" cy="116" rx="8" ry="12" fill="currentColor" opacity="0.7" transform="rotate(20 28 116)" />
                                    <ellipse cx="28" cy="24" rx="8" ry="12" fill="currentColor" opacity="0.7" transform="rotate(-25 28 24)" />
                                </svg>
                            </div>
                        </div>

                        {badge && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px' }}>
                                <h2 style={{ fontSize: 28, fontWeight: 'bold', color: '#0f172a', margin: 0, marginBottom: '6px', textAlign: 'center' }}>
                                    {badge.text}
                                </h2>
                                <p style={{ fontSize: 20, color: '#64748b', margin: 0, textAlign: 'center', maxWidth: '500px', lineHeight: 1.4 }}>
                                    {badge.subtitle}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', marginBottom: '32px' }}>
                        <span style={{ fontSize: 64, fontWeight: 'bold', color: '#cbd5e1', marginBottom: '12px' }}>—</span>
                        <p style={{ fontSize: 24, color: '#94a3b8', margin: 0, textAlign: 'center' }}>No ratings yet.</p>
                    </div>
                )}

                {topTags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
                        {topTags.slice(0, 5).map((tag: string) => (
                            <div
                                key={tag}
                                style={{
                                    padding: '8px 16px',
                                    background: '#f1f5f9',
                                    color: '#334155',
                                    borderRadius: '12px',
                                    fontSize: 18,
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
