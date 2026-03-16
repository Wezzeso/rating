import React from 'react';
import Link from 'next/link';
import { Shield, Info, Heart, Scale } from 'lucide-react';

export const metadata = {
    title: 'About Us | Teacher Rating',
    description: 'Learn about our mission, moderation policies, and commitment to transparency.',
};

export default function AboutUs() {
    return (
        <div className="mx-auto max-w-5xl w-full px-4 py-12 sm:px-6 lg:px-8">
            <div className="space-y-12 text-center sm:text-left">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-100 sm:text-5xl">
                        About Us
                    </h1>
                    <p className="mt-4 text-xl text-gray-600 dark:text-zinc-400">
                        Transparency, fairness, and support for the academic community.
                    </p>
                </div>

                <div className="grid gap-12 md:grid-cols-2">
                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                            <Heart size={28} />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Our Mission</h2>
                        </div>
                        <p className="text-gray-600 dark:text-zinc-300">
                            We believe in the power of constructive feedback. Our platform is designed to support <strong>any professor</strong> by providing a space for honest, student-driven insights. We aim to help students make informed decisions while giving educators valuable perspectives on their teaching and proctoring impact.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                            <Shield size={28} />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Moderation</h2>
                        </div>
                        <p className="text-gray-600 dark:text-zinc-300">
                            Fairness is at our core. We have established rigorous moderation guidelines to ensure that all reviews are respectful and helpful. We do not tolerate harassment or personal attacks, ensuring a safe environment for both students and professors.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                            <Scale size={28} />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Legal Clarity</h2>
                        </div>
                        <p className="text-gray-600 dark:text-zinc-300">
                            Teacher Rating acts solely as a technology provider. We do not break any laws by giving access to users to share their experiences. We take matters of <strong>defamation (клевета)</strong> and moderation seriously, providing tools for reporting and review while remaining a neutral platform for user-generated content.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                            <Info size={28} />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Name Removal</h2>
                        </div>
                        <p className="text-gray-600 dark:text-zinc-300">
                            We respect individual privacy and institutional requests. We have <strong>no problem removing any name</strong> from our database if requested through the proper channels. Our goal is to be a helpful resource, not a source of conflict.
                        </p>
                        <div className="pt-2">
                            <Link 
                                href="/removal-request" 
                                className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Submit a removal request →
                            </Link>
                        </div>
                    </section>
                </div>

                <div className="border-t border-gray-200 dark:border-zinc-800 pt-12 text-center">
                    <p className="text-gray-500 dark:text-zinc-400">
                        Have questions about our policies? Check our{' '}
                        <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Terms of Use
                        </Link>{' '}
                        or{' '}
                        <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                            Privacy Policy
                        </Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
