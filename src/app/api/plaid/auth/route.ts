import { NextResponse } from 'next/server';
import { plaidClient } from '../plaidConfig';
import { BanquestSecCode } from '../../banquest/banquestConfig';

interface RequestBody {
    access_token: string
}

export async function POST(req: Request): Promise<NextResponse> {
    const { access_token }: RequestBody = await req.json();
    if (!access_token) return NextResponse.json({ status: false, message: `access_token is require` }, { status: 400 });

    try {
        const response = await plaidClient.authGet({
            access_token
        });
        let achData: Array<any> = [];

        const accounts = response.data.accounts;
        const numbers = response.data.numbers;

        if (accounts && numbers.ach) {
            accounts.forEach((account, index) => {
                const { account_id, name, official_name, subtype: account_type } = account;
                const accountDetails = numbers.ach.filter(data => data.account_id == account_id)[0];
                const { account: account_number, routing: routing_number } = accountDetails;
                achData.push({
                    account_id,
                    name: official_name,
                    routing_number,
                    account_number,
                    account_type,
                    sec_code: BanquestSecCode.PPD
                })
            });
        }

        return NextResponse.json({ status: true, ach_data: achData, accounts });
    } catch (error) {
        return NextResponse.json({ error: 'Error generating auth data' }, { status: 500 });
    }
}