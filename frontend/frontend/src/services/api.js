import axios from "axios";

// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_KEY; // URL backend

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Fix for axios versions where the request config doesn't have the custom properties after a redirect
    if (!originalRequest._retry) {
      originalRequest._retry = false;
    }

    // If the error is 401 (Unauthorized) and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          // No refresh token available, redirect to login
          localStorage.clear(); // Clear all auth data
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Important: Use a new axios instance for refresh token to avoid infinite loop
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (refreshResponse.data.accessToken) {
          // Update tokens in localStorage
          localStorage.setItem("accessToken", refreshResponse.data.accessToken);

          if (refreshResponse.data.refreshToken) {
            localStorage.setItem(
              "refreshToken",
              refreshResponse.data.refreshToken
            );
          }

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          return axios(originalRequest);
        } else {
          throw new Error("No access token received");
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("username");
        localStorage.removeItem("userType");

        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      console.error(
        "Permission denied. User doesn't have access to this resource."
      );
      // You could handle this differently, like showing a message or redirecting
      // For now, we'll just pass through the error
    }

    return Promise.reject(error);
  }
);

// ===================== Auth ===================== //
export const login = async (login, password) => {
  try {
    const response = await api.post("/auth/login", { login, password });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const googleLogin = async (tokenId) => {
  try {
    const response = await api.post("/auth/staff/google-login", { tokenId });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await api.post("/auth/logout");
    // Clear local storage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userType");
    return response.data;
  } catch (error) {
    // Still clear storage even if API fails
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userType");
    handleApiError(error);
    throw error;
  }
};

export const forgotPassword = async (login) => {
  try {
    const response = await api.post("/auth/forgot-password", { login });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const refreshToken = async (refreshToken) => {
  try {
    const response = await api.post("/auth/refresh-token", { refreshToken });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ===================== Staff ===================== //
export const getStaff = async () => {
  try {
    const response = await api.get("/Staff");
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getDishById = async (id) => {
  try {
    const response = await api.get(`/Staff/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createDish = async (StaffData) => {
  try {
    const response = await api.post("/Staff", StaffData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateDish = async (id, StaffData) => {
  try {
    const response = await api.put(`/Staff/${id}`, StaffData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const deleteDish = async (id) => {
  try {
    const response = await api.delete(`/Staff/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ===================== Customers ===================== //
export const getCustomers = async () => {
  try {
    const response = await api.get("/customers");
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getCustomerById = async (id) => {
  try {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createCustomer = async (customerData) => {
  try {
    const response = await api.post("/customers", customerData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const deleteCustomer = async (id) => {
  try {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ===================== Tables ===================== //
export const getTables = async () => {
  try {
    const response = await api.get("/api/staff/tables");
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getTableDishes = async (tableId) => {
  try {
    const response = await api.get(`/api/staff/tables/${tableId}/dishes`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateTableStatus = async (tableId, status) => {
  try {
    const response = await api.put(`/api/staff/tables/${tableId}`, { status });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ===================== Orders ===================== //
export const getOrders = async () => {
  try {
    const response = await api.get("/orders");
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await api.post("/orders", orderData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.put(`/staff/orders/${orderId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// ===================== Helper Functions ===================== //

// Error handler to standardize error logging and handling
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error("API Error Response:", {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    });
  } else if (error.request) {
    // The request was made but no response was received
    console.error("API Error Request:", error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error("API Error:", error.message);
  }
};

// Auth helper functions
export const getCurrentUser = () => {
  return {
    username: localStorage.getItem("username"),
    userType: localStorage.getItem("userType"),
  };
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("accessToken");
};

export const hasRole = (role) => {
  const userType = localStorage.getItem("userType");
  return userType === role;
};

export default api;