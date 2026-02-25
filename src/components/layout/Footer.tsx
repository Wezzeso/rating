import Link from 'next/link';

export function Footer() {
    return (
        <footer className="w-full border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/50 py-8 mt-auto ">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} Made by Wezeso
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Use</Link>
                    <Link href="https://t.me/wezeso_channel" className="hover:text-gray-900 dark:hover:text-white transition-colors">Subscribe to Telegram Channel</Link>
                </div>
            </div>
        </footer>
    );
}
