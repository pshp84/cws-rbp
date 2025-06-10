import { NextResponse } from "next/server";
import { tremendousApiCall } from "../tremendousConfig";
import { getOption } from "@/DbClient";

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

        const productsResponse = await tremendousApiCall.get("/products?country=US&currency=USD");
        const { products } = productsResponse.data;
        if (products) {
            responseData.status = true;
            responseData.data = products;
        }

        return NextResponse.json(responseData);


    } catch (error: any) {
        responseData.status = false;
        responseData.message = error.message;
        responseData.error = (error.response ? { error: error.response.data } : {});
        return NextResponse.json(responseData, { status: 500 });
    }
}