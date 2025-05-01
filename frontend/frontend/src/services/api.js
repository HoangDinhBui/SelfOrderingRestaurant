import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_KEY; // URL backend

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          // No refresh token available, redirect to login
          window.location.href = "/login";
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {
            refreshToken: refreshToken,
          }
        );

        // Update tokens in localStorage
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("username");
        localStorage.removeItem("userType");

        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ===================== Auth ===================== //
export const login = async (login, password) => {
  const response = await api.post("/auth/login", { login, password });
  return response.data;
};

export const googleLogin = async (tokenId) => {
  const response = await api.post("/auth/staff/google-login", { tokenId });
  return response.data;
};

export const logout = async () => {
  const response = await api.post("/auth/logout");
  // Clear local storage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  localStorage.removeItem("userType");
  return response.data;
};

export const forgotPassword = async (login) => {
  const response = await api.post("/auth/forgot-password", { login });
  return response.data;
};

export const refreshToken = async (refreshToken) => {
  const response = await api.post("/auth/refresh-token", { refreshToken });
  return response.data;
};

// ===================== Staff ===================== //
export const getStaff = async () => {
  const response = await api.get("/Staff");
  return response.data;
};

export const getDishById = async (id) => {
  const response = await api.get(`/Staff/${id}`);
  return response.data;
};

export const createDish = async (StaffData) => {
  const response = await api.post("/Staff", StaffData);
  return response.data;
};

export const updateDish = async (id, StaffData) => {
  const response = await api.put(`/Staff/${id}`, StaffData);
  return response.data;
};

export const deleteDish = async (id) => {
  const response = await api.delete(`/Staff/${id}`);
  return response.data;
};

// ===================== Customers ===================== //
export const getCustomers = async () => {
  const response = await api.get("/customers");
  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (customerData) => {
  const response = await api.post("/customers", customerData);
  return response.data;
};

export const updateCustomer = async (id, customerData) => {
  const response = await api.put(`/customers/${id}`, customerData);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/customers/${id}`);
  return response.data;
};

// ===================== Tables ===================== //
export const getTables = async () => {
  const response = await api.get("/tables");
  return response.data;
};

export const updateTableStatus = async (tableId, status) => {
  const response = await api.put(`/tables/${tableId}`, { status });
  return response.data;
};

// ===================== Orders ===================== //
export const getOrders = async () => {
  const response = await api.get("/orders");
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export const createOrder = async (orderData) => {
  const response = await api.post("/orders", orderData);
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.put(`/staff/orders/${orderId}/status`, { status });
  return response.data;
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
