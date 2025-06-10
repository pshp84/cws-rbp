import { NextResponse } from 'next/server';
import { plaidClient } from '../plaidConfig';
import { CountryCode, Products } from 'plaid';

interface RequestBody {
    client_user_id: string
}

export async function POST(req: Request): Promise<NextResponse> {
    const { client_user_id }: RequestBody = await req.json();
    if (!client_user_id) return NextResponse.json({ status: false, message: `client_user_id is require` }, { status: 400 });

    try {
        const response = await plaidClient.linkTokenCreate({
            user: { client_user_id },
            client_name: 'RBP Club App',
            products: [
                Products.Auth,
                Products.Transactions,
            ],
            country_codes: [CountryCode.Us],
            language: 'en',
        });
        return NextResponse.json({ status: true, link_token: response.data.link_token });
    } catch (error) {
        return NextResponse.json({ error: 'Error generating Plaid link token' }, { status: 500 });
    }
}