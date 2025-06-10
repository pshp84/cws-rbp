import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const plaidClientID: string | undefined = process.env.NEXT_PUBLIC_PLAID_CLIENT_ID;
const plaidSecret: string | undefined = process.env.NEXT_PUBLIC_PLAID_SECRET;
const plaidEnv: string | undefined = process.env.NEXT_PUBLIC_PLAID_ENV;

const config = new Configuration({
    basePath: PlaidEnvironments[plaidEnv as keyof typeof PlaidEnvironments],
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': plaidClientID || '',
            'PLAID-SECRET': plaidSecret || '',
        },
    },
});

export const plaidClient = new PlaidApi(config);
