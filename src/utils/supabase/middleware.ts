import { membershipStatus, userRoles } from '@/DbClient';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const CACHE_DURATION = 300;

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const url = request.nextUrl.clone();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
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

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isAuthRoute = [
        '/api',
        '/auth',
        '/sign-up',
        '/sign-in',
        '/sign-out',
        '/forgot-password',
        '/update-password'
    ].some((path) => request.nextUrl.pathname.startsWith(path));

    if (!user && !isAuthRoute && !request.nextUrl.pathname.startsWith('/new-deals')) {
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
}

    if (user && !isAuthRoute) {
        const userID = user.id;
        const cachedRole = request.cookies.get('user_role')?.value;

        let userRole = cachedRole;

        if (!cachedRole) {
            const { data: userData, error: userDataError } = await supabase
                .from('users')
                .select('user_role')
                .eq('user_id', userID)
                .single();

            if (userDataError) {
                url.pathname = '/sign-in';
                url.searchParams.set('error-message', 'Account is not available.');
                return NextResponse.redirect(url);
            }

            userRole = userData.user_role;

            supabaseResponse.cookies.set('user_role', userRole || "", {
                maxAge: CACHE_DURATION,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
            });
        }

        if (userRole == userRoles.User) {
            if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/property-manager')) {
                url.pathname = '/dashboard';
                return NextResponse.redirect(url);
            }

            const { data: membership, error: membershipError } = await supabase.from('memberships')
                .select('*')
                .eq('user_id', userID)
                .single();

            if (membershipError || !membership) {
                url.pathname = '/sign-up';
                url.searchParams.set('error-message', 'Membership is currently unavailable.');
                return NextResponse.redirect(url);
            }

            const { status } = membership;

            if (!status) {
                url.pathname = '/sign-in';
                url.searchParams.set('error-message', 'Membership is currently unavailable.');
                return NextResponse.redirect(url);
            }

            if (status != membershipStatus.Active) {
                url.pathname = '/sign-in';
                url.searchParams.set('error-message', `Membership is on ${status}.`);
                return NextResponse.redirect(url);
            }
        }

        if (userRole == userRoles.PropertyManager) {
            if (!request.nextUrl.pathname.startsWith('/property-manager')) {
                url.pathname = '/property-manager/dashboard';
                return NextResponse.redirect(url);
            }
        }
    }

    return supabaseResponse;
}
