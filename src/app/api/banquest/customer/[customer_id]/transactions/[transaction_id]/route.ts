import { NextResponse } from "next/server";
import { banquestApiCall } from "@/api/banquest/banquestConfig";

interface Params {
    customer_id: string;
}

interface RequestBody {
    order: string;
    payment_type: string;
    limit: string;
    offset: string;
}

interface PostRequestBody {
    title: string;
    amount: number;
    payment_method_id: string;
    frequency: string;
}

interface DeleteRequestBody {
    recurring_schedule_id: string;
}

const allowedFrequencies = [
    "daily", "weekly", "biweekly", "monthly", "bimonthly",
    "quarterly", "biannually", "annually"
];

export async function GET(req: Request, { params }: { params: Params }) {
    const { customer_id } = params;

    try {
        const { searchParams } = new URL(req.url);
        const order = searchParams.get('order') || "asc";
        const payment_type = searchParams.get('payment_type') || "credit_card";
        const limit = searchParams.get('limit') || "10";
        const offset = searchParams.get('offset') || "0";

        const requestBody: RequestBody = {
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

    } catch (error) {
        const errorResponse = {
            status: false,
            message: error.message,
            ...(error.response ? { error: error.response.data } : {}),
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Params }) {
    const { customer_id } = params;

    try {
        const { title, amount, payment_method_id, frequency }: PostRequestBody = await req.json();

        // Validate request data
        if (!title) {
            return NextResponse.json({ status: false, error: "Title is required" }, { status: 400 });
        }

        if (amount === undefined) {
            return NextResponse.json({ status: false, error: "Amount is required" }, { status: 400 });
        }

        if (!payment_method_id) {
            return NextResponse.json({ status: false, error: "Payment method ID is required" }, { status: 400 });
        }

        if (!allowedFrequencies.includes(frequency)) {
            return NextResponse.json({
                status: false,
                error: `Please provide valid frequency, allowed frequencies are ${allowedFrequencies.join(', ')}.`
            }, { status: 400 });
        }

        const postBody: PostRequestBody = {
            title,
            amount,
            payment_method_id,
            frequency
        };

        const response = await banquestApiCall.post(`/customers/${customer_id}/recurring-schedules`, postBody);

        return NextResponse.json({
            status: true,
            message: "The recurring schedule was created successfully.",
            data: response.data
        }, { status: 200 });

    } catch (error) {
        const errorResponse = {
            status: false,
            message: error.message,
            ...(error.response ? { error: error.response.data } : {}),
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Params }) {
    const { customer_id } = params;

    try {
        const { recurring_schedule_id }: DeleteRequestBody = await req.json();

        // Validate request data
        if (!recurring_schedule_id) {
            return NextResponse.json({ status: false, error: "Recurring schedule ID is required" }, { status: 400 });
        }

        const response = await banquestApiCall.delete(`/recurring-schedules/${recurring_schedule_id}`);

        return NextResponse.json({
            status: true,
            message: "The recurring schedule was deleted successfully."
        }, { status: 200 });

    } catch (error) {
        const errorResponse = {
            status: false,
            message: error.message,
            ...(error.response ? { error: error.response.data } : {}),
        };
        return NextResponse.json(errorResponse, { status: 500 });
    }
}
