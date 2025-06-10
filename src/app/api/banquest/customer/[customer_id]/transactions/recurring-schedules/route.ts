import { NextResponse } from "next/server";
import { banquestApiCall, calculateNextRunDate } from "@/api/banquest/banquestConfig";
import { membershipPlanFrequency } from "@/DbClient";

interface Params {
    customer_id: string;
}

interface PostRequestBody {
    title: string;
    amount: number;
    payment_method_id: string;
    frequency?: membershipPlanFrequency;
    next_run_date?: string;
}

interface ApiResponse<T = any> {
    status: boolean;
    message: string;
    data?: T;
    error?: any; // Optional error property
}

export async function POST(req: Request, { params }: { params: Params }): Promise<Response> {
    const { customer_id } = params;

    try {
        const { title, amount, payment_method_id, frequency, next_run_date }: PostRequestBody = await req.json();

        // Validate request data
        if (!title) {
            return NextResponse.json<ApiResponse>({ status: false, message: "", error: "Title is required" }, { status: 400 });
        }

        if (amount === undefined) {
            return NextResponse.json<ApiResponse>({ status: false, message: "", error: "Amount is required" }, { status: 400 });
        }

        if (!payment_method_id) {
            return NextResponse.json<ApiResponse>({ status: false, message: "", error: "Payment method ID is required" }, { status: 400 });
        }

        const postBody: PostRequestBody = {
            title,
            amount,
            payment_method_id,
            frequency
        };

        if (frequency && !next_run_date) {
            const nextRunDate = calculateNextRunDate(frequency);
            postBody.next_run_date = nextRunDate;
        } else if (next_run_date) {
            postBody.next_run_date = next_run_date;
        }

        const response = await banquestApiCall.post(`/customers/${customer_id}/recurring-schedules`, postBody);

        return NextResponse.json<ApiResponse>({
            status: true,
            message: "The recurring schedule was created successfully.",
            data: response.data
        }, { status: 200 });

    } catch (error) {
        // Catch and handle any errors that occur during the API call.
        const errorResponse: ApiResponse = {
            status: false,
            message: (error as Error).message
        };
        if ((error as any).response) {
            errorResponse.error = (error as any).response.data;
        }
        return NextResponse.json(errorResponse, { status: 500 });
    }
}
