import { rbpApiCall } from "./rbpApiCallConfig";

export const createPlaidLinkToken = async (userID: string) => {
    try {
        const response = await rbpApiCall.post('/plaid/create-link-token', {
            client_user_id: userID
        });
        return response.data.link_token;
    } catch (error) {
        console.error('Error generating link token:', error);
        return false;
    }
}