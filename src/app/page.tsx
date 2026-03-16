import React from 'react';
import Link from 'next/link';
import { 
    Shield, 
    Scale, 
    CheckCircle2, 
    AlertCircle,
    Gavel,
    ScrollText,
    LogIn,
    UserPlus,
    Info,
    ArrowRight
} from 'lucide-react';
import { createServerComponentClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export const metadata = {
    title: 'Platform Framework | Teacher Rating',
    description: 'The formal academic and legal framework of the Teacher Rating platform.',
};

export default async function LandingPage() {
    const supabase = await createServerComponentClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        redirect('/professors');
    }

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 antialiased">
            {/* 1. Hero Section - Flat & Direct */}
            <header className="py-24 px-6 border-b border-gray-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">
                        <ScrollText size={12} />
                        Platform Framework
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-gray-950 dark:text-white leading-[1.05]">
                        Student Feedback <br />
                        <span className="text-gray-400 dark:text-zinc-600">Infrastructure.</span>
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                        A neutral technological foundation established to facilitate transparent communication between students and educators.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                        <Link 
                            href="/login" 
                            className="w-full sm:w-auto px-10 py-4 text-sm font-bold text-white bg-gray-950 dark:bg-zinc-100 dark:text-gray-950 rounded-xl hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <LogIn size={18} />
                            Log In
                        </Link>
                        <Link 
                            href="/register" 
                            className="w-full sm:w-auto px-10 py-4 text-sm font-bold text-gray-950 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-gray-950 dark:border-zinc-100 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <UserPlus size={18} />
                            Register
                        </Link>
                    </div>
                </div>
            </header>

            {/* 2. Article I - Context */}
            <section className="py-24 px-6 bg-gray-50 dark:bg-zinc-900/20 border-b border-gray-100 dark:border-zinc-900">
                <div className="max-w-4xl mx-auto">
                    <div className="grid gap-16 md:grid-cols-2">
                        <div className="space-y-6">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Article I: Nature of Service</h2>
                            <p className="text-lg leading-relaxed font-medium">
                                This platform provides a service similar to global academic systems like <strong>RateMyProfessors</strong> and <strong>Uloop</strong>.
                            </p>
                            <p className="text-gray-500 dark:text-zinc-400 leading-relaxed">
                                We host user-generated feedback, enabling the academic community to maintain a transparent record of pedagogical performance and student satisfaction.
                            </p>
                        </div>
                        <div className="p-8 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-3xl space-y-4">
                            <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                <Info size={14} />
                                Technical Definition
                            </div>
                            <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed font-mono">
                                The provider acts as a passive conduit for user data. All information is processed according to strict moderation rules designed to prevent harassment.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Article II - Principles */}
            <section className="py-24 px-6 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-900">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-16">Article II: Governance</h2>
                    <div className="grid gap-12 md:grid-cols-3">
                        {[
                            { icon: CheckCircle2, title: 'Neutrality', desc: 'We do not interpret or weigh feedback. We record voices exactly as provided.' },
                            { icon: Shield, title: 'Compliance', desc: 'Moderation systems enforce local laws regarding defamation and institutional standards.' },
                            { icon: Scale, title: 'Integrity', desc: 'Verified student access ensures the authenticity of the information exchange.' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-4">
                                <div className="text-gray-950 dark:text-white p-3 bg-gray-50 dark:bg-zinc-900 w-fit rounded-xl">
                                    <item.icon size={24} strokeWidth={2.5} />
                                </div>
                                <h3 className="font-bold text-base tracking-tight">{item.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Article III - Legal */}
            <section className="py-24 px-6 bg-gray-50 dark:bg-zinc-900/20 border-b border-gray-100 dark:border-zinc-900">
                <div className="max-w-4xl mx-auto space-y-16">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Article III: Legal Integrity</h2>
                    <div className="grid gap-12 md:grid-cols-2">
                        <div className="flex gap-6">
                            <Gavel size={24} className="text-gray-300 dark:text-zinc-700 shrink-0" />
                            <div className="space-y-4">
                                <h4 className="font-bold text-xs uppercase tracking-widest">Liability Notice</h4>
                                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
                                    We respect the work of educators. Our goal is never to insult or defame. We host the technology that allows students to share documented experiences safely.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <Scale size={24} className="text-gray-300 dark:text-zinc-700 shrink-0" />
                            <div className="space-y-4">
                                <h4 className="font-bold text-xs uppercase tracking-widest">Expression Rights</h4>
                                <p className="text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
                                    The platform empowers students to provide honest feedback, helping others make informed academic choices through a safe environment.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Article IV - Educator Access */}
            <section className="py-24 px-6 bg-white dark:bg-zinc-950">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-12">Article IV: Privacy Control</h2>
                    <div className="bg-gray-950 dark:bg-white p-12 text-white dark:text-gray-950 border border-gray-900 dark:border-gray-100 rounded-[2.5rem]">
                        <div className="max-w-2xl space-y-8">
                            <h2 className="text-3xl font-bold tracking-tight">Educator Removal Protocol</h2>
                            <p className="text-lg leading-relaxed text-gray-400 dark:text-zinc-500">
                                If you prefer not to be reviewed on this system, you can request the deactivation of your listing through our formal administrative channel.
                            </p>
                            <Link
                                href="/removal-request"
                                className="inline-flex items-center gap-2 text-sm font-black border-b-2 border-white dark:border-gray-950 pb-1 hover:gap-4 transition-all"
                            >
                                Submit Request
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="py-16 px-6 border-t border-gray-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                        <AlertCircle size={12} />
                        Framework Node
                    </div>
                    <div className="flex gap-10">
                        <Link href="/terms" className="text-[10px] font-bold text-gray-400 hover:text-gray-950 dark:hover:text-white transition-colors uppercase tracking-[0.2em]">Terms</Link>
                        <Link href="/privacy" className="text-[10px] font-bold text-gray-400 hover:text-gray-950 dark:hover:text-white transition-colors uppercase tracking-[0.2em]">Privacy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
