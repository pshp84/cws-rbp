import { NextResponse } from "next/server";
import { banquestApiCall } from "@/api/banquest/banquestConfig";
import { getTransactionByBanquestID, getTransactionByMeta, updateMembership, updateTransaction, updateTransactionMeta } from "@/DbClient";


interface Params {
    batch_id: string;
}

export async function GET(req: Request, { params }: { params: Params }): Promise<NextResponse> {
    const { batch_id } = params;

    try {

        // const batch = await banquestApiCall.get(`/batches/${batch_id}`);
        // if (batch.status === 404) {
        //     return NextResponse.json({
        //         status: false,
        //         message: "The batch was not found.",
        //     }, { status: batch.status });
        // }

        // const { transactions_count } = batch.data;

        const response = await banquestApiCall.get(`/batches/${batch_id}/transactions?limit=${50}`);

        if (response.status !== 200) {
            return NextResponse.json({
                status: false,
                message: "The transactions not found.",
            }, { status: response.status });
        }

        const batchTransactions: Array<any> = response.data;

        return NextResponse.json({
            status: true,
            message: "The transactions were retrieved successfully.",
            data: batchTransactions,
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