import axios from 'axios';
import { toast } from 'sonner';

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337/api";
if (process.env.NODE_ENV === "development" && !process.env.NEXT_PUBLIC_API_URL) {
    console.warn("[booking-nail] NEXT_PUBLIC_API_URL is not set; falling back to http://localhost:1337/api");
}

const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            toast.error(`Error ${error.response.status}: ${error.response.data?.message || 'Request failed'}`);
        } else if (error.request) {
            toast.error("No response received from the server.");
        } else {
            toast.error(`Error: ${error.message}`);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
