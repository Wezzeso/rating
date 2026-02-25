import React from 'react';

export const metadata = {
    title: 'Terms of Use | Teacher Rating',
    description: 'Terms of Use for the Teacher Rating platform.',
};

export default function TermsOfUse() {
    return (
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="prose prose-blue dark:prose-invert max-w-none">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">Terms of Use</h1>

                <div className="space-y-6 text-gray-600 dark:text-gray-300">
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Agreement to Terms</h2>
                        <p>
                            By accessing and using the Teacher Rating platform, you accept and agree to be bound by the terms
                            and provision of this agreement. Our platform provides a space for students to anonymously rate
                            professors on Teaching and Proctoring quality.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Community Guidelines and Abuse</h2>
                        <p>
                            When participating on our platform by rating or suggesting professors, you agree to the following rules:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>
                                <strong>Honest Ratings:</strong> All ratings must reflect your genuine personal experience with the professor.
                                Attempting to artificially manipulate a professor's score is strictly prohibited.
                            </li>
                            <li>
                                <strong>Rate Limiting:</strong> To protect the platform from spam and denial-of-service, we strictly
                                enforce rate limits. You are permitted a maximum of 5 ratings per minute and 3 professor suggestions per minute.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Suggesting Professors</h2>
                        <p>
                            Our platform allows you to submit suggestions for new professors to be added to our database. When suggesting
                            a professor, you must ensure:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li>The suggested name is accurate and valid (between 2 and 100 characters, containing only letters, spaces, hyphens, periods, or apostrophes).</li>
                            <li>The suggestion does not already exist in our database.</li>
                        </ul>
                        <p className="mt-2">
                            All suggested professors are submitted as "pending" and require manual approval by our administration team
                            before they become publicly visible on the platform. We reserve the right to reject or delete any suggestion at our sole discretion.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Intellectual Property</h2>
                        <p>
                            The Service and its original content, features, and functionality (including the rating system, database structure,
                            and frontend application) are and will remain the exclusive property of our platform and its developers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Limitation of Liability</h2>
                        <p>
                            The aggregated ratings provided on this platform are subjective opinions submitted by anonymous users and do not
                            represent the views or official assessments of any educational institution. We do not guarantee the accuracy,
                            reliability, or validity of any ratings or scores displayed.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify or replace these Terms at any time. By continuing to access or use our Service
                            after those revisions become effective, you agree to be bound by the revised terms.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
