import { NextResponse } from "next/server";
import { tremendousApiCall } from "../tremendousConfig";
import { getOptions } from "@/DbClient";

interface RequestBody {
    reward_amount: number;
    recipient_name: string;
    recipient_email: string;
}

interface responseData {
    status: boolean,
    data?: any,
    message?: string,
    error?: any
}

export async function POST(req: Request): Promise<NextResponse> {

    const { reward_amount, recipient_name, recipient_email }: RequestBody = await req.json();

    const responseData: responseData = {
        status: false
    }

    try {

        const payload: any = {
            payment: {
                funding_source_id: "balance"
            },
            reward: {
                value: {
                    denomination: reward_amount,
                    currency_code: "USD"
                },
                delivery: {
                    method: "EMAIL"
                },
                recipient: {
                    name: recipient_name,
                    email: recipient_email
                }
            }
        }

        const tremendousSettings = await getOptions(["tremendous_campaign_id", "tremendous_funding_source_id"]);
        let campaignID = "";
        let fundingSourceID = "";

        if (tremendousSettings && tremendousSettings.length > 0) {
            campaignID = tremendousSettings.filter((data: { option_key: string; }) => data.option_key == "tremendous_campaign_id")[0].option_value;
            fundingSourceID = tremendousSettings.filter((data: { option_key: string; }) => data.option_key == "tremendous_funding_source_id")[0].option_value;
        }

        if (campaignID != "") {
            payload.reward.campaign_id = campaignID;
        } else {
            const productsResponse = await tremendousApiCall.get("/products?country=US&currency=USD");
            const { products } = productsResponse.data;
            if (products) {
                payload.reward.products = products.map((data: { id: any; }) => data.id);
            }
        }

        if (fundingSourceID != "") {
            payload.payment.funding_source_id = fundingSourceID;
        }


        const response = await tremendousApiCall.post("/orders", payload);

        if (response.data) {
            const data = response.data;
            responseData.status = true;
            responseData.data = data;
            return NextResponse.json(responseData);
        }

        return NextResponse.json(responseData);


    } catch (error: any) {
        responseData.status = false;
        responseData.message = error.message;
        responseData.error = (error.response ? { error: error.response.data } : {});
        return NextResponse.json(responseData, { status: 500 });
    }
}