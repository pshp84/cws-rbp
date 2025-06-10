import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosHeaders } from "axios";

const appURL: string | undefined = process.env.NEXT_PUBLIC_NEXTAUTH_URL;

// Ensure appURL is defined
if (!appURL) {
    throw new Error("Missing NEXT_PUBLIC_NEXTAUTH_URL in environment variables.");
}

const apiBaseURL: string = `${appURL}api`;

export const rbpApiCall: AxiosInstance = axios.create({
    baseURL: apiBaseURL,
});

// Add a request interceptor
rbpApiCall.interceptors.request.use(
    (config) => {
        const internalConfig = config as InternalAxiosRequestConfig;

        if (internalConfig.method === "post") {
            // Ensure headers are of type AxiosHeaders and use the `set` method to assign Content-Type
            (internalConfig.headers as AxiosHeaders).set("Content-Type", "application/json");
        }

        // Check for token in request options and add it to headers
        if (internalConfig.headers && internalConfig.headers['AuthorizationToken']) {
            const token = internalConfig.headers['AuthorizationToken'];
            (internalConfig.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
            delete internalConfig.headers['AuthorizationToken']; // Clean up custom header
        }

        return internalConfig;
    },
    (error) => {
        return Promise.reject(error);
    }
);
