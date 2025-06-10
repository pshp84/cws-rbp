import { NextResponse } from 'next/server';
import { banquestApiCall } from "@/api/banquest/banquestConfig";

interface Address {
    first_name?: string;
    last_name?: string;
    [key: string]: any;
}

interface RequestBody {
    identifier?: string;
    customer_number: string;
    email: string;
    billing_address?: Address;
    shipping_address?: Address;
    first_name: string;
    last_name: string;
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        // Parse the request body
        const { identifier, email, billing_address, shipping_address, first_name, last_name, customer_number }: RequestBody = await req.json();

        // Validate request data
        if (!first_name || first_name === "" || typeof first_name === "undefined") {
            return NextResponse.json({ error: "First name is required" }, { status: 400 });
        }

        if (!last_name || last_name === "" || typeof last_name === "undefined") {
            return NextResponse.json({ error: "Last name is required" }, { status: 400 });
        }

        if (!customer_number || customer_number === "" || typeof customer_number === "undefined") {
            return NextResponse.json({ error: "Customer number is required" }, { status: 400 });
        }

        if (!email || email === "" || typeof email === "undefined") {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const identifierData = (identifier) ? identifier : `${first_name} ${last_name} (${email})`;

        const postBody: RequestBody = {
            identifier: identifierData,
            customer_number,
            email,
            billing_address,
            shipping_address,
            first_name,
            last_name,
        };

        // Make the API request to the Banquest API
        const response = await banquestApiCall.post("/customers", postBody);

        // Return the response from Banquest API to the client
        return NextResponse.json(response.data, { status: 200 });
    } catch (error: any) {
        // Catch and handle any errors that occur during the API call.
        const errorResponse = {
            status: false,
            message: error.message,
            ...(error.response ? { error: error.response.data } : {}),
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
