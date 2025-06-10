import { NextResponse } from "next/server";
import { banquestApiCall } from "@/api/banquest/banquestConfig";

interface Params {
    customer_id: string;
}

interface TransactionRequest {
    order?: string;
    payment_type?: string;
    limit?: number;
    offset?: number;
}

interface PostRequestBody {
    source: string;
    source_type: string;
    description: string;
    amount: string;
    save_card?: boolean;
    expiry_month: string;
    expiry_year: string;
}

export async function GET(req: Request, { params }: { params: Params }): Promise<NextResponse> {
    const { customer_id } = params;

    try {
        const { searchParams } = new URL(req.url);
        const order = searchParams.get("order") || "asc";
        const payment_type = searchParams.get("payment_type") || "credit_card";
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = parseInt(searchParams.get("offset") || "0");

        const requestBody: TransactionRequest = {
            order,
            payment_type,
            limit,
            offset
        };

        const response = await banquestApiCall.get(`/customers/${customer_id}/transactions`, { params: requestBody });

        return NextResponse.json({
            status: true,
            message: "The transactions were retrieved successfully.",
            data: response.data
        }, { status: 200 });

    } catch (error: any) {
        const errorResponse = {
            status: false,
            message: error.message,
            ...(error.response ? { error: error.response.data } : {}),
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Params }): Promise<NextResponse> {
    const { customer_id } = params;

    try {
        const { source, source_type, description, amount, save_card, expiry_month, expiry_year }: PostRequestBody = await req.json();

        if (!source) {
            return NextResponse.json({ status: false, error: "Source is required" }, { status: 400 });
        }
        if (!source_type) {
            return NextResponse.json({ status: false, error: "Source type is required" }, { status: 400 });
        } else if (!['ref', 'pm', 'tkn', 'nonce'].includes(source_type)) {
            return NextResponse.json({ status: false, error: "Source type is invalid" }, { status: 400 });
        }
        if (!description) {
            return NextResponse.json({ status: false, error: "Description is required" }, { status: 400 });
        }
        if (!amount) {
            return NextResponse.json({ status: false, error: "Amount is required" }, { status: 400 });
        }
        if (source_type === "nonce" && !expiry_month) {
            return NextResponse.json({ status: false, error: "Expiry month is required" }, { status: 400 });
        }
        if (source_type === "nonce" && !expiry_year) {
            return NextResponse.json({ status: false, error: "Expiry year is required" }, { status: 400 });
        }

        const postBody = {
            source: `${source_type}-${source}`,
            name: "credit card",
            transaction_details: {
                description
            },
            amount,
            expiry_month,
            expiry_year,
            customer: {
                customer_id: parseInt(customer_id)
            },
            save_card
        };

        let response = await banquestApiCall.post(`/transactions/charge`, postBody);

        if (response.data.status && response.data.status === "Error") {
            if (response.data.error_code === "911") {
                response = await banquestApiCall.post(`/transactions/charge`, postBody);
                if (response.data.status && response.data.status === "Error") {
                    return NextResponse.json({
                        status: false,
                        message: response.data.error_message,
                        data: response.data
                    }, { status: 200 });
                }
            } else {
                return NextResponse.json({
                    status: false,
                    message: response.data.error_message,
                    data: response.data
                }, { status: 200 });
            }
        }

        return NextResponse.json({
            status: true,
            message: "The authorization was processed successfully.",
            data: response.data
        }, { status: 200 });

    } catch (error: any) {
        const errorResponse = {
            status: false,
            message: error.message,
            ...(error.response ? { error: error.response.data } : {}),
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
}
