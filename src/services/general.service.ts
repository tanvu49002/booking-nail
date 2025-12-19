import axiosInstance from "@/lib/axios";

const generalService = {
  getServices: async (params?: Record<string, string | number | boolean>) => {
    const response = await axiosInstance.get("/services", { params });
    return response.data;
  },

  getEmployees: async (params?: Record<string, string | number | boolean>) => {
    const response = await axiosInstance.get("/employees", { params });
    return response.data;
  },

  createBooking: async (params: unknown) => {
    const response = await axiosInstance.post("/bookings/create-with-customer", params);
    return response.data;
  },

  getCustomerByPhone: async (params: unknown) => {
    const response = await axiosInstance.get(`/customers`, { params });
    return response.data;
  },
};

export default generalService;
