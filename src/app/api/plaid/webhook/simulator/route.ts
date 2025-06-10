import { NextResponse } from 'next/server';
import { plaidClient } from '../../plaidConfig';
import { SandboxBankTransferFireWebhookRequest } from 'plaid';

interface RequestBody {
    webhook_url: string
}

export async function POST(req: Request): Promise<NextResponse> {
    const { webhook_url }: RequestBody = await req.json();
    if (!webhook_url) return NextResponse.json({ status: false, message: `webhook_url is require` }, { status: 400 });

    try {
        const request: SandboxBankTransferFireWebhookRequest = {
            webhook: webhook_url
        }

        const response = await plaidClient.sandboxBankTransferFireWebhook(request);

        return NextResponse.json({ status: true, data: response.data });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}