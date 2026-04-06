import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // --- I18N LOGIC for Non-Admin Routes ---
    const excludedPaths = ['/admin', '/api', '/_next'];
    const isI18nPath = !excludedPaths.some(path => pathname.startsWith(path)) && !pathname.includes('.');

    // Clone request headers early so we can pass them in NextResponse.next()
    const requestHeaders = new Headers(request.headers);
    let locale = request.cookies.get('NEXT_LOCALE')?.value;

    if (isI18nPath) {
        if (!locale) {
            // Attempt to auto-detect language
            const country = (request as any).geo?.country || '';
            if (country === 'DE' || country === 'AT' || country === 'CH') {
                locale = 'de';
            } else {
                locale = 'en';
            }
        }
        requestHeaders.set('x-locale', locale || 'en');
    }

    let supabaseResponse = NextResponse.next({
        request: {
            headers: requestHeaders,
        }
    });

    if (isI18nPath && locale) {
        supabaseResponse.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    }

    // --- AUTH LOGIC for Admin Routes ---
    if (pathname.startsWith('/admin')) {
        // Skip initializing Supabase if env variables are not present yet
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.warn('Supabase environment variables are missing. Middleware is skipping authentication checks.');
            return supabaseResponse;
        }

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                        supabaseResponse = NextResponse.next({
                            request: {
                                headers: requestHeaders, // keep the cloned headers
                            }
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (pathname !== '/admin/login') {
            if (!user) {
                const url = request.nextUrl.clone()
                url.pathname = '/admin/login'
                return NextResponse.redirect(url)
            }
        }

        if (pathname === '/admin/login' && user) {
            const url = request.nextUrl.clone()
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|images|favicon.ico).*)',
    ],
};
