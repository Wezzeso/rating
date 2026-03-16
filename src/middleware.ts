import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Student email regex: 2XXXXX@astanait.edu.kz
 * Examples: 240539@astanait.edu.kz, 250101@astanait.edu.kz
 */
export const STUDENT_EMAIL_REGEX = /^2\d{5}@astanait\.edu\.kz$/i;

/**
 * Routes that DON'T require authentication.
 * Everything else requires a logged-in student.
 */
const PUBLIC_PATHS = ['/login', '/register', '/privacy', '/terms', '/removal-request', '/about', '/'];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + '/')
    );
}

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh the session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // If NOT logged in and NOT on a public path → redirect to /login
    if (!user && !isPublicPath(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If logged in but email doesn't match student pattern → sign out and redirect
    if (user && !STUDENT_EMAIL_REGEX.test(user.email || '')) {
        // Clear auth cookies by signing out
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'invalid_email');
        return NextResponse.redirect(url);
    }

    // If logged in and on /login → redirect to home
    if (user && pathname === '/login') {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static, _next/image
         * - favicon, static assets
         * - admin routes (admin has its own cookie-based auth)
         */
        '/((?!_next/static|_next/image|favicon.ico|admin|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
