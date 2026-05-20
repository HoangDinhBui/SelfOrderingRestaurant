import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const paymentAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

paymentAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const handleApiError = (error) => {
  if (error.response) {
    console.error("API Error Response:", error.response.data);
    return error.response.data;
  } else if (error.request) {
    console.error("API Request Error:", error.request);
    return { success: false, message: "No response received from server" };
  } else {
    console.error("API Error:", error.message);
    return { success: false, message: error.message };
  }
};

export const confirmPayment = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error("Invalid order ID");
    }
    console.log("Confirming payment for orderId:", orderId);
    const response = await paymentAPI.post("/payment/confirm", { orderId });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getPaymentStatus = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error("Invalid order ID");
    }
    const response = await paymentAPI.get(`/payment/payment/status/${orderId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
