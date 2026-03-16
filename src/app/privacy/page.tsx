import React from 'react';

export const metadata = {
    title: 'Privacy Policy | Teacher Rating',
    description: 'Privacy Policy describing how we handle your data on the Teacher Rating platform.',
};

export default function PrivacyPolicy() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="prose prose-blue dark:prose-invert max-w-none">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mb-8">Privacy Policy</h1>

                <div className="space-y-6 text-gray-600 dark:text-zinc-100">
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-4">1. Introduction</h2>
                        <p>
                            Welcome to the Teacher Rating platform. We respect your privacy and are committed to protecting
                            your data. This application is designed to allow students to anonymously rate professors on
                            Teaching and Proctoring.
                        </p>
                        <p className="mt-2 text-blue-600 dark:text-blue-400 font-bold">
                            All data on this platform is provided and sent by users only. The owner of the platform is not responsible for the accuracy or nature of user-generated content.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-4">2. The Data We Collect About You</h2>
                        <p>
                            To maintain the integrity of our rating system while preserving your anonymity, we collect minimal data:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>
                                <strong>Anonymous Identifiers:</strong> We hash your internet protocol (IP) address using SHA-256 to create
                                an anonymous fingerprint. This fingerprint cannot be reversed to identify your actual IP address
                                or any other personally identifiable information (PII).
                            </li>
                            <li>
                                <strong>Usage Data:</strong> We collect the ratings you submit (scores from 1 to 5) for teaching
                                and proctoring, as well as any new professor suggestions you make.
                            </li>
                            <li>
                                <strong>Administrator Data:</strong> For designated administrators managing the platform, we securely
                                process email addresses and passwords via Supabase Authentication.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-4">3. How We Use Your Data</h2>
                        <p>
                            We use the collected data strictly for the operation and security of the platform:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>
                                <strong>Preventing Abuse:</strong> The anonymous fingerprint is used solely to ensure that a user
                                cannot submit multiple ratings for the same professor, maintaining fairness and accuracy.
                            </li>
                            <li>
                                <strong>Rate Limiting:</strong> We use your IP address temporarily in memory to enforce rate limits
                                (preventing spam by restricting the number of ratings and suggestions submitted per minute).
                                This data is periodically purged and never permanently stored.
                            </li>
                            <li>
                                <strong>Displaying Ratings:</strong> The anonymous scores you provide are publicly aggregated and displayed
                                as averages for each professor.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-4">4. Data Security</h2>
                        <p>
                            All system data is securely stored using Supabase. We restrict public access to sensitive information.
                            The anonymous fingerprints associated with ratings are completely hidden from public views
                            via database security policies, ensuring your identity remains concealed from other users.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-4">5. Disclaimer of Liability</h2>
                        <p className="font-bold text-red-600 dark:text-red-400">
                            The owner, founders, and developers of the Teacher Rating platform are NOT responsible or liable in any manner for any content, ratings, suggestions, or other actions made by users on the platform. All data is user-generated and provided by users only. Usage of this platform is entirely at your own risk. The owner does not take responsibility for anything related to the platform's use.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-4">6. Information</h2>
                        <p>
                            If you have any questions about this privacy policy or our practices, please contact the platform administration.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
