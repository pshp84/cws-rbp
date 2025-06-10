import { NextResponse } from "next/server";
import { banquestApiCall } from "@/api/banquest/banquestConfig";
import { membershipPlanFrequency } from "@/DbClient";

interface Params {
    customer_id: string;
    recurring_schedule_id: string;
}

export interface banquestRecurringSchedulesPatchData {
    title?: string;
    amount?: number;
    next_run_date?: string;
    frequency?: membershipPlanFrequency;
    num_left?: number;
    payment_method_id?: string;
    active?: boolean;
    receipt_email?: string;
}

export async function GET(req: Request, { params }: { params: Params }): Promise<Response> {
    const { customer_id, recurring_schedule_id } = params;

    try {
        const response = await banquestApiCall.get(`recurring-schedules/${recurring_schedule_id}`);

        return NextResponse.json({
            status: true,
            message: "The recurring schedule was retrieved successfully.",
            data: response.data
        }, { status: 200 });

    } catch (error) {
        const errorResponse = {
            status: false,
            message: (error as Error).message
        };
        if ((error as any).response) {
            errorResponse.message = (error as any).response.data;
        }
        return NextResponse.json(errorResponse, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Params }): Promise<Response> {
    const { customer_id, recurring_schedule_id } = params;

    try {
        const requestBody: banquestRecurringSchedulesPatchData = await req.json();

        const response = await banquestApiCall.patch(`recurring-schedules/${recurring_schedule_id}`, requestBody);

        return NextResponse.json({
            status: true,
            message: "The recurring schedule was updated successfully.",
            data: response.data
        }, { status: 200 });

    } catch (error) {
        const errorResponse = {
            status: false,
            message: (error as Error).message
        };
        if ((error as any).response) {
            errorResponse.message = (error as any).response.data;
        }
        return NextResponse.json(errorResponse, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Params }): Promise<Response> {
    const { customer_id, recurring_schedule_id } = params;

    try {
        const response = await banquestApiCall.delete(`recurring-schedules/${recurring_schedule_id}`);

        return NextResponse.json({
            status: true,
            message: "The recurring schedule was deleted successfully."
        }, { status: 200 });

    } catch (error) {
        const errorResponse = {
            status: false,
            message: (error as Error).message
        };
        if ((error as any).response) {
            errorResponse.message = (error as any).response.data;
        }
        return NextResponse.json(errorResponse, { status: 500 });
    }
}
