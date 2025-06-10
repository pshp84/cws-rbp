import { NextResponse } from "next/server";
import { banquestApiCall } from "@/api/banquest/banquestConfig";

interface Address {
    first_name?: string;
    last_name?: string;
    [key: string]: any;
}

interface RequestBody {
    identifier?: string;
    customer_number?: string;
    email?: string;
    billing_address?: Address;
    shipping_address?: Address;
    first_name?: string;
    last_name?: string;
}

interface Params {
    customer_id: string;
}

export async function GET(req: Request, { params }: { params: Params }): Promise<NextResponse> {
    const { customer_id } = params;

    try {
        const response = await banquestApiCall.get(`/customers/${customer_id}`);

        if (response.status === 200) {
            return NextResponse.json({
                status: true,
                message: "The customer was returned successfully.",
                data: response.data,
            }, { status: 200 });
        } else {
            return NextResponse.json({
                status: false,
                message: "The customer was not updated.",
            }, { status: response.status });
        }
    } catch (error: any) {
        const errorResponse = {
            status: false,
            message: error.message,
            ...(error.response ? { error: error.response.data } : {}),
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Params }): Promise<NextResponse> {
    const { customer_id } = params;

    try {
        const { identifier, customer_number, email, billing_address, shipping_address, first_name, last_name }: RequestBody = await req.json();

        const postBody: RequestBody = {};
        if (identifier) postBody.identifier = identifier;
        if (customer_number) postBody.customer_number = customer_number;
        if (email) postBody.email = email;
        if (billing_address) postBody.billing_address = billing_address;
        if (shipping_address) postBody.shipping_address = shipping_address;
        if (first_name) postBody.first_name = first_name;
        if (last_name) postBody.last_name = last_name;

        const response = await banquestApiCall.patch(`/customers/${customer_id}`, postBody);

        if (response.status === 200) {
            return NextResponse.json({
                status: true,
                message: "The customer was updated successfully.",
                data: response.data,
            }, { status: 200 });
        } else {
            return NextResponse.json({
                status: false,
                message: "The customer was not updated.",
            }, { status: response.status });
        }
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
        const response = await banquestApiCall.delete(`/customers/${customer_id}`);

        if (response.status === 204) {
            return NextResponse.json({
                status: true,
                message: "The customer was deleted successfully.",
            }, { status: 200 });
        } else {
            return NextResponse.json({
                status: false,
                message: "The customer was not updated.",
            }, { status: response.status });
        }
    } catch (error: any) {
        const errorResponse = {
            status: false,
            message: error.message,
            ...(error.response ? { error: error.response.data } : {}),
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
