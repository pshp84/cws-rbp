import { membershipPlanFrequency } from "@/DbClient";
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosHeaders } from "axios";

export const tokenizationKey: string | undefined = process.env.NEXT_PUBLIC_BANQUEST_TOKENIZATION_KEY;
export const webhookSignatureKey: string | undefined = process.env.NEXT_PUBLIC_BANQUEST_WEBHOOK_SIGNATURE_KEY;
const apiSourceKey: string | undefined = process.env.NEXT_PUBLIC_BANQUEST_SOURCE_KEY;
const apiSourcePin: string | undefined = process.env.NEXT_PUBLIC_BANQUEST_SOURCE_PIN;
const apiBaseURL: string | undefined = process.env.NEXT_PUBLIC_BANQUEST_API_URL;

export const banquestApiCall: AxiosInstance = axios.create({
    baseURL: apiBaseURL,
    headers: new AxiosHeaders({
        "Authorization": `Basic ${Buffer.from(`${apiSourceKey}:${apiSourcePin}`).toString("base64")}`,
    })
});

banquestApiCall.interceptors.request.use(
    (config) => {
        const internalConfig = config as InternalAxiosRequestConfig;

        if (internalConfig.method === "post") {
            // Ensure headers are of type AxiosHeaders and use the `set` method to assign Content-Type
            (internalConfig.headers as AxiosHeaders).set("Content-Type", "application/json");
        }

        return internalConfig;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export enum BanquestTransactionStatus {
    Captured = "captured",
    Pending = "pending",
    Reserve = "reserve",
    Originated = "originated",
    Returned = "returned",
    Cancelled = "cancelled",
    Queued = "queued",
    Declined = "declined",
    Error = "error",
    Settled = "settled",
    Voided = "voided",
    Approved = "approved",
    Blocked = "blocked",
    Expired = "expired"
}

export enum BanquestPaymentMethodTypes {
    cc = "cc",
    ach = "ach"
}

export enum BanquestAccountTypes {
    Checking = "checking",
    Savings = "savings"
}

export enum BanquestSecCode {
    PPD = "PPD",
    CCD = "CCD",
    TEL = "TEL",
    WEB = "WEB"
}

export const calculateNextRunDate = (frequency: membershipPlanFrequency = membershipPlanFrequency.Daily): string => {
    const currentDate = new Date();

    switch (frequency) {
        case "weekly":
            currentDate.setDate(currentDate.getDate() + 7);
            break;
        case "biweekly":
            currentDate.setDate(currentDate.getDate() + 14);
            break;
        case "monthly":
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        case "bimonthly":
            currentDate.setMonth(currentDate.getMonth() + 2);
            break;
        case "quarterly":
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
        case "biannually":
            currentDate.setMonth(currentDate.getMonth() + 6);
            break;
        case "annually":
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
        default:
            currentDate.setDate(currentDate.getDate() + 1);
    }

    return currentDate.toISOString().split('T')[0]; // Return date in "YYYY-MM-DD" format
}