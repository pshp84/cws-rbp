import { NextResponse } from "next/server";
import { BanquestAccountTypes, banquestApiCall, BanquestPaymentMethodTypes, BanquestSecCode } from "@/api/banquest/banquestConfig";

interface Params {
    customer_id: string;
}

interface RequestBody {
    type?: BanquestPaymentMethodTypes;
    routing_number?: string;
    account_number?: string;
    account_type?: BanquestAccountTypes;
    sec_code?: BanquestSecCode;
    nonce_token?: string;
    name?: string;
    expiry_month?: string;
    expiry_year?: string;
    payment_method_id?: string;
}

export async function GET(req: Request, { params }: { params: Params }): Promise<NextResponse> {
    const { customer_id } = params;

    try {
        const { searchParams } = new URL(req.url);
        const payment_method_id = searchParams.get("payment_method_id");

        let response;
        if (payment_method_id) {
            response = await banquestApiCall.get(`/payment-methods/${payment_method_id}`);
        } else {
            response = await banquestApiCall.get(`/customers/${customer_id}/payment-methods`);
        }

        return NextResponse.json({
            status: true,
            message: "The payment method was retrieved successfully.",
            data: response.data,
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
        const { type, nonce_token, name, expiry_month, expiry_year, account_number, account_type, routing_number, sec_code = BanquestSecCode.PPD }: RequestBody = await req.json();

        if (!type) {
            return NextResponse.json({ status: false, error: "Payment method type is required" }, { status: 400 });
        }

        let postBody = {}

        if (type == BanquestPaymentMethodTypes.cc) {
            if (!nonce_token) return NextResponse.json({ status: false, error: "Token is required" }, { status: 400 });
            if (!expiry_month) return NextResponse.json({ status: false, error: "Expiry month is required" }, { status: 400 });
            if (!expiry_year) return NextResponse.json({ status: false, error: "Expiry year is required" }, { status: 400 });

            postBody = {
                source: `nonce-${nonce_token}`,
                expiry_month,
                expiry_year,
                name,
            };
        } else if (type == BanquestPaymentMethodTypes.ach) {
            if (!account_number) return NextResponse.json({ status: false, error: "Account number is required" }, { status: 400 });
            if (!account_type) return NextResponse.json({ status: false, error: "Account type is required" }, { status: 400 });
            if (!routing_number) return NextResponse.json({ status: false, error: "Routing number is required" }, { status: 400 });

            postBody = {
                account_number,
                account_type,
                routing_number,
                sec_code,
                name
            };
        }        

        const response = await banquestApiCall.post(`/customers/${customer_id}/payment-methods`, postBody);

        return NextResponse.json({
            status: true,
            message: "The payment method was created successfully.",
            data: response.data,
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

export async function DELETE(req: Request, { params }: { params: Params }): Promise<NextResponse> {
    const { customer_id } = params;

    try {
        const { payment_method_id }: RequestBody = await req.json();

        if (!payment_method_id) {
            return NextResponse.json({ status: false, error: "Payment method id is required" }, { status: 400 });
        }

        const response = await banquestApiCall.delete(`/payment-methods/${payment_method_id}`);

        return NextResponse.json({
            status: true,
            message: "The payment method was deleted successfully.",
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
