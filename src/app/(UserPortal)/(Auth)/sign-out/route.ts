import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get('redirect-to') || `${process.env.NEXT_PUBLIC_NEXTAUTH_URL || ''}sign-in`;
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (!error) {
        const response = NextResponse.redirect(redirectTo);
        response.cookies.set('user_role', '', { 
            maxAge: -1, // Expire immediately
            path: '/'   // Make sure path matches
        });
        console.log("cookies", response.cookies.getAll());
        return response;
    }

    return NextResponse.redirect('/auth/error');
}