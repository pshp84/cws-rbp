import { NextResponse } from "next/server";
import { tremendousApiCall } from "../tremendousConfig";

interface responseData {
    status: boolean,
    data?: any,
    message?: string,
    error?: any
}

export async function POST(req: Request): Promise<NextResponse> {

    const responseData: responseData = {
        status: false
    }

    try {
        const campaignsResponse = await tremendousApiCall.get("/campaigns");
        const { campaigns } = campaignsResponse.data;
        if (!campaigns) {
            responseData.message = "Campaigns not found";
            responseData.data = [];
            return NextResponse.json(responseData);
        }
        responseData.status = true;
        responseData.data = campaigns;
        return NextResponse.json(responseData);
    } catch (error: any) {
        responseData.status = false;
        responseData.message = error.message;
        responseData.error = (error.response ? { error: error.response.data } : {});
        return NextResponse.json(responseData, { status: 500 });
    }
}