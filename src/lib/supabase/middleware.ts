import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Route protection logic
    const path = request.nextUrl.pathname

    // Public routes that don't satisfy the matcher should be excluded in middleware.ts config.
    // However, for routes matched (everything effectively), we filter here.

    // Auth routes (accessible only by guests)
    const isAuthRoute = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/forgot-password')

    // Public Assets / API exclusion (handled by matcher usually, but safe to verify)
    // Note: API routes are often protected, so careful with strict "public" lists.

    if (!user && !isAuthRoute) {
        // Redirect unauthenticated users to login (if not already there)
        // Also allow root '/' if it's a landing page.
        if (path === '/') {
            // If root is public landing: allow.
            // If root matches "dashboard" intent: redirect.
            // Assumption: '/' is public landing.
            return response
        }

        // For any other protected route, redirect to login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user) {
        // Redirect authenticated users away from auth routes
        if (isAuthRoute) {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        // Check for Tenant logic
        // We avoid DB call on every request if possible, but for MVP strictness we check 'usuarios' profile.
        // If user is on /onboarding or /api routes, we bypass check to allow creation.
        // Also allow sign out.

        const isOnboarding = path.startsWith('/onboarding') || path.startsWith('/api/') || path.startsWith('/_next') || path.startsWith('/logout')

        if (!isOnboarding) {
            const { data: profile } = await supabase
                .from('usuarios')
                .select('tenant_id')
                .eq('id', user.id)
                .single()

            // If no profile found (sync issue) or no tenant_id assigned -> Redirect to Onboarding
            if (!profile || !profile.tenant_id) {
                const url = request.nextUrl.clone()
                url.pathname = '/onboarding'
                return NextResponse.redirect(url)
            }
        }
    }

    return response
}
