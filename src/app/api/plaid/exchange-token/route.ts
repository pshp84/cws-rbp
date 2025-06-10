import { NextResponse } from 'next/server';
import { plaidClient } from '../plaidConfig';

interface RequestBody {
    public_token: string
}

export async function POST(req: Request): Promise<NextResponse> {
    const { public_token }: RequestBody = await req.json();
    if (!public_token) return NextResponse.json({ status: false, message: `public_token is require` }, { status: 400 });

    try {
        const response = await plaidClient.itemPublicTokenExchange({ public_token });
        const { access_token } = response.data;
        return NextResponse.json({ status: true, access_token: access_token });
    } catch (error) {
        return NextResponse.json({ error: 'Error generating Plaid link token' }, { status: 500 });
    }
}