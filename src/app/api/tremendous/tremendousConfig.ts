import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosHeaders } from "axios";

export const tremendousEnv: string | undefined = process.env.NEXT_PUBLIC_TREMENDOUS_ENV;
export const tremendousApiKey: string | undefined = process.env.NEXT_PUBLIC_TREMENDOUS_API_KEY;
const apiBaseURL: string | undefined = process.env.NEXT_PUBLIC_TREMENDOUS_API_URL;
console.log("apiBaseURL", `${apiBaseURL}/api/v2`);

export const tremendousApiCall: AxiosInstance = axios.create({
    baseURL: `${apiBaseURL}/api/v2`,
    headers: new AxiosHeaders({
        "Accept": 'application/json',
        "Authorization": `Bearer ${tremendousApiKey}`
    })
});

tremendousApiCall.interceptors.request.use(
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