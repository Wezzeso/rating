import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LiveVisitorTracker } from "@/components/features/LiveVisitorTracker";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Professor Ratings",
  description: "Rate and review professors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <Header />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
            <Toaster />
            <LiveVisitorTracker />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
