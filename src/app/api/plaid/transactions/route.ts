import { NextResponse } from 'next/server';
import { AccountsGetRequest, TransactionsGetRequest } from 'plaid';
import { plaidClient } from '../plaidConfig';

interface RequestBody {
    access_token: string,
    start_date?: string,
    end_date?: string,
    personal_finance_category_detailed?: string
}

export async function POST(req: Request): Promise<NextResponse> {
    const { access_token: accessToken, end_date, start_date, personal_finance_category_detailed }: RequestBody = await req.json();
    if (!accessToken) return NextResponse.json({ status: false, message: `access_token is required` }, { status: 400 });

    try {
        // Determine the current month's start and end dates in YYYY-MM-DD format
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

        const request: TransactionsGetRequest = {
            access_token: accessToken,
            start_date: start_date || firstDayOfMonth,
            end_date: end_date || lastDayOfMonth,
        };

        const response = await plaidClient.transactionsGet(request);
        let transactions = response.data.transactions;
        const total_transactions = response.data.total_transactions;

        // Handle pagination
        while (transactions.length < total_transactions) {
            const paginatedRequest: TransactionsGetRequest = {
                access_token: accessToken,
                start_date: request.start_date,
                end_date: request.end_date,
                options: {
                    offset: transactions.length,
                },
            };
            const paginatedResponse = await plaidClient.transactionsGet(paginatedRequest);
            transactions = transactions.concat(paginatedResponse.data.transactions);
        }

        // Filter transactions by personal_finance_category
        if (personal_finance_category_detailed) {
            transactions = transactions.filter((transaction) => {
                const { personal_finance_category } = transaction;

                const matchesDetailed = personal_finance_category?.detailed === personal_finance_category_detailed;

                return (matchesDetailed);
            });
        }

        const accountIDs: Array<string> = [];

        transactions.map(transaction => {
            if (!transaction.account_id) return;
            const accountID = transaction.account_id;
            if (!accountIDs.includes(accountID)) accountIDs.push(accountID);
        });

        if (accountIDs.length > 0) {
            const request: AccountsGetRequest = {
                access_token: accessToken,
                options: {
                    account_ids: accountIDs
                }
            }
            const accountsGetResponse = await plaidClient.accountsGet(request);
            const { accounts } = accountsGetResponse.data;

            if (accounts) {
                transactions = transactions.map(transaction => {
                    if (!transaction.account_id) return transaction;
                    const accountData = accounts.filter(account => account.account_id == transaction.account_id)[0];
                    return { ...transaction, account_data: accountData }
                });
            }
        }

        return NextResponse.json({ status: true, transactions });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
