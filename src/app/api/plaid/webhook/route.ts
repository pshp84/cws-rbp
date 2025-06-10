import { NextResponse } from 'next/server';
import { WebhookVerificationKeyGetRequest } from 'plaid';
import { plaidClient } from '../plaidConfig';
import { jwtDecode } from 'jwt-decode';
import { jwtVerify, importJWK } from 'jose';

const KEY_CACHE = new Map();

export async function POST(req: Request): Promise<NextResponse> {
    try {

        const signedJwt = req.headers.get('plaid-verification');
        if (!signedJwt) return NextResponse.json({ status: false, message: "Not plaid webhook" });

        const decodedTokenHeader = jwtDecode(signedJwt, { header: true });
        const currentKeyID = decodedTokenHeader.kid;

        // If key not in cache, update the key cache
        if (!KEY_CACHE.has(currentKeyID)) {
            const keyIDsToUpdate = [];
            KEY_CACHE.forEach((key) => {
                if (key.expired_at == null) {
                    keyIDsToUpdate.push(key.key_id);
                }
            });
            keyIDsToUpdate.push(currentKeyID);
            for (const keyID of keyIDsToUpdate) {
                if (keyID) {
                    try {
                        const request: WebhookVerificationKeyGetRequest = {
                            key_id: keyID
                        };
                        const response = await plaidClient.webhookVerificationKeyGet(request);
                        const key = response.data.key;
                        KEY_CACHE.set(keyID, key);
                    } catch (err) {
                        console.error('Error updating Plaid keys:', err);
                        return NextResponse.json({ error: 'Error updating key cache' }, { status: 200 });
                    }
                }

            }
        }

        if (!KEY_CACHE.has(currentKeyID)) {
            return NextResponse.json({ error: 'Invalid key ID' }, { status: 200 });
        }

        const key = KEY_CACHE.get(currentKeyID);

        if (key.expired_at != null) {
            return NextResponse.json({ error: 'Expired key' }, { status: 200 });
        }

        // Validate the signature and iat
        try {
            const keyLike = await importJWK(key);
            await jwtVerify(signedJwt, keyLike, { maxTokenAge: '5 min' });
        } catch (error) {
            console.error('JWT verification failed:', error);
            return NextResponse.json({ error: 'Invalid JWT' }, { status: 200 });
        }

        

        return NextResponse.json({ status: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 200 });
    }
}