import { NextResponse } from 'next/server';
import { BanquestAccountTypes, banquestApiCall, BanquestPaymentMethodTypes, BanquestSecCode, calculateNextRunDate } from "@/api/banquest/banquestConfig";
import { membershipPlanFrequency } from '@/DbClient';

interface Address {
    first_name?: string;
    last_name?: string;
    street?: string;
    street2?: string;
    state?: string;
    city?: string;
    zip?: string;
    country?: string;
}

export interface SignupBanquestPaymentRequestBody {
    customerData: {
        identifier?: string;
        customer_number: string;
        email: string;
        billing_address?: Address;
        shipping_address?: Address;
        first_name: string;
        last_name: string;
    },
    paymentData: {
        type: BanquestPaymentMethodTypes;
        routing_number?: string;
        account_number?: string;
        account_type?: BanquestAccountTypes;
        sec_code?: BanquestSecCode;
        nonce_token?: string;
        name?: string;
        expiry_month?: string | number;
        expiry_year?: string | number;
    },
    chargeData: {
        description: string;
        amount: string;
    },
    recurringPaymentData: {
        title?: string;
        frequency?: membershipPlanFrequency;
    },
    discount?: "free period"
}

export async function POST(req: Request): Promise<NextResponse> {
    try {
        const requestBody = await req.json();

        // Create customer
        const { customerData: {
            customer_number, email, first_name, last_name, billing_address, identifier, shipping_address
        }, discount }: SignupBanquestPaymentRequestBody = requestBody;
        const identifierData = (identifier) ? identifier : `${first_name} ${last_name} (${email})`;
        const customerPayload = {
            identifier: identifierData,
            customer_number,
            email,
            billing_info: billing_address,
            shipping_info: shipping_address,
            first_name,
            last_name,
        };
        const customerResponse = await banquestApiCall.post("/customers", customerPayload);
        const customerData = customerResponse.data;
        if (!customerData.id) return NextResponse.json({ status: false, error: "customer is not created" }, { status: 400 });
        const banquestCustomerID = customerData.id;
        // EOF Create customer



        // Create Payment method
        const { paymentData: {
            account_number, account_type, expiry_month, expiry_year, name, nonce_token, routing_number, sec_code, type
        } }: SignupBanquestPaymentRequestBody = requestBody
        let paymentMethodsPayload = {}
        let nameOnCharge = "credit card";
        if (type == BanquestPaymentMethodTypes.cc) {
            if (!nonce_token) return NextResponse.json({ status: false, error: "Token is required" }, { status: 400 });
            if (!expiry_month) return NextResponse.json({ status: false, error: "Expiry month is required" }, { status: 400 });
            if (!expiry_year) return NextResponse.json({ status: false, error: "Expiry year is required" }, { status: 400 });

            paymentMethodsPayload = {
                source: `nonce-${nonce_token}`,
                expiry_month,
                expiry_year,
                name,
            };
        } else if (type == BanquestPaymentMethodTypes.ach) {
            if (!account_number) return NextResponse.json({ status: false, error: "Account number is required" }, { status: 400 });
            if (!account_type) return NextResponse.json({ status: false, error: "Account type is required" }, { status: 400 });
            if (!routing_number) return NextResponse.json({ status: false, error: "Routing number is required" }, { status: 400 });

            paymentMethodsPayload = {
                account_number,
                account_type,
                routing_number,
                sec_code: BanquestSecCode.PPD,
                name
            };
            nameOnCharge = name || "ACH";
        }

        const paymentMethodsResponse = await banquestApiCall.post(`/customers/${banquestCustomerID}/payment-methods`, paymentMethodsPayload);
        const banquestPaymentID = paymentMethodsResponse.data.id;
        // EOF Create Payment method


        const { chargeData: {
            amount, description
        } }: SignupBanquestPaymentRequestBody = requestBody;

        let customerChargeData: object | boolean = false;
        if (!discount || discount !== "free period") {
            // Take a charge
            const chargePayload = {
                source: `pm-${banquestPaymentID}`,
                name: nameOnCharge,
                transaction_details: {
                    description
                },
                amount,
                customer: {
                    customer_id: parseInt(banquestCustomerID)
                }
            };

            let chargeResponse = await banquestApiCall.post(`/transactions/charge`, chargePayload);
            if (chargeResponse.data.status && chargeResponse.data.status === "Error") {
                if (chargeResponse.data.error_code === "911") {
                    chargeResponse = await banquestApiCall.post(`/transactions/charge`, chargePayload);
                    if (chargeResponse.data.status && chargeResponse.data.status === "Error") {
                        return NextResponse.json({
                            status: false,
                            message: chargeResponse.data.error_message
                        }, { status: 400 });
                    }
                }
            }
            customerChargeData = chargeResponse.data;
            // EOF Take a charge
        }


        // Create recurring transaction
        const { recurringPaymentData: {
            frequency, title = description
        } }: SignupBanquestPaymentRequestBody = requestBody;

        const recurringSchedulesPayload: any = {
            title,
            amount,
            payment_method_id: banquestPaymentID,
            frequency,
            next_run_date: calculateNextRunDate(frequency)
        };

        const recurringSchedulesResponse = await banquestApiCall.post(`/customers/${banquestCustomerID}/recurring-schedules`, recurringSchedulesPayload);
        // EOF Create recurring transaction

        return NextResponse.json({
            status: true,
            data: {
                customerData,
                paymentMethodData: paymentMethodsResponse.data,
                chargeData: customerChargeData,
                recurringScheduleData: recurringSchedulesResponse.data
            }
        }, { status: 200 });

    } catch (error: any) {
        // Catch and handle any errors that occur during the API call.
        const errorResponse = {
            status: false,
            message: error.message,
            ...(error.response ? { error: error.response.data } : {}),
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
