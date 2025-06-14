import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const publicAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    const publicEndpoints = [
      "/api/payment",
      "/api/auth/login",
      "/api/auth/forgot-password",
      "/api/auth/refresh-token",
      "/api/auth/reset-password",
      "/api/auth/logout",
      "/api/customers",
      "/api/images",
      "/api/orders",
      "/api/dishes",
      "/api/notifications",
      "/api/categories",
    ];
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url.startsWith(endpoint)
    );
    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      console.log("FormData detected, removing Content-Type");
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] =
        config.headers["Content-Type"] || "application/json";
    }
    console.log("authAPI Request:", {
      url: config.url,
      headers: config.headers,
      data: config.data instanceof FormData ? "FormData" : config.data,
    });
    return config;
  },
  (error) => {
    console.error("authAPI Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

publicAPI.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      console.log("FormData detected in publicAPI, removing Content-Type");
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] =
        config.headers["Content-Type"] || "application/json";
    }
    console.log("publicAPI Request:", {
      url: config.url,
      headers: config.headers,
      data: config.data instanceof FormData ? "FormData" : config.data,
    });
    return config;
  },
  (error) => {
    console.error("publicAPI Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest._retry) {
      originalRequest._retry = false;
    }
    const publicEndpoints = [
      "/api/payment",
      "/api/auth/login",
      "/api/auth/forgot-password",
      "/api/auth/refresh-token",
      "/api/auth/reset-password",
      "/api/auth/logout",
      "/api/customers",
      "/api/images",
      "/api/orders",
      "/api/dishes",
      "/api/notifications",
      "/api/categories",
      "/api/attendance/check-out",
    ];
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      originalRequest.url.startsWith(endpoint)
    );
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicEndpoint
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          console.log("No refreshToken, authentication required");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("username");
          localStorage.removeItem("userType");
          localStorage.removeItem("staffId");
          return Promise.reject(error);
        }
        const refreshResponse = await publicAPI.post(
          "/api/auth/refresh-token",
          { refreshToken }
        );
        if (refreshResponse.data.accessToken) {
          localStorage.setItem("accessToken", refreshResponse.data.accessToken);
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem(
              "refreshToken",
              refreshResponse.data.refreshToken
            );
          }
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          return authAPI(originalRequest);
        } else {
          throw new Error("Không nhận được access token");
        }
      } catch (refreshError) {
        console.error("Làm mới token thất bại:", refreshError);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("username");
        localStorage.removeItem("userType");
        localStorage.removeItem("staffId");
        console.log("Refresh failed, authentication required");
        return Promise.reject(refreshError);
      }
    }
    if (error.response?.status === 403) {
      console.error("403 Forbidden:", {
        url: originalRequest.url,
        message:
          error.response?.data?.message ||
          "Không có quyền truy cập tài nguyên này",
        pathname: window.location.pathname,
      });
    }
    return Promise.reject(error);
  }
);

// Authentication
export const login = async (login, password) => {
  try {
    const response = await publicAPI.post("/auth/login", { login, password });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const googleLogin = async (tokenId) => {
  try {
    const response = await publicAPI.post("auth/staff/google-login", {
      tokenId,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await authAPI.post("/auth/logout");
    return response.data;
  } catch (error) {
    console.error("Logout error:", error);
    handleApiError(error);
    throw error;
  }
};

export const forgotPassword = async ({ username, email }) => {
  try {
    const response = await publicAPI.post("/auth/forgot-password", {
      username,
      email,
    });
    return response.data;
  } catch (error) {
    console.error(
      "Forgot password error:",
      error.response?.data,
      error.response?.status
    );
    throw error;
  }
};

export const resetPassword = async ({ otp, newPassword }) => {
  try {
    const response = await publicAPI.post("/api/auth/reset-password", {
      otp,
      newPassword,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const refreshToken = async (refreshToken) => {
  try {
    const response = await publicAPI.post("/auth/refresh-token", {
      refreshToken,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Staff
export const getStaff = async () => {
  try {
    const response = await authAPI.get("/api/admin/staff");
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getStaffById = async (id) => {
  try {
    const response = await authAPI.get(`/api/staff/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getDishById = async (id) => {
  try {
    const response = await authAPI.get(`/api/staff/dishes/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createDish = async (dishData) => {
  try {
    const response = await authAPI.post("/api/staff/dishes", dishData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateDish = async (id, dishData) => {
  try {
    const response = await authAPI.put(`/api/staff/dishes/${id}`, dishData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const deleteDish = async (id) => {
  try {
    const response = await authAPI.delete(`/api/staff/dishes/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Attendance
export const attendanceCheckOut = async (imageBlob, staffId) => {
  try {
    const formData = new FormData();
    formData.append("image", imageBlob, "check-out.jpg");
    formData.append("staffId", staffId);
    const response = await authAPI.post("/api/attendance/check-out", formData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Customers
export const getCustomers = async () => {
  try {
    const response = await publicAPI.get("/api/customers");
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getCustomerById = async (id) => {
  try {
    const response = await publicAPI.get(`/api/customers/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createCustomer = async (customerData) => {
  try {
    const response = await publicAPI.post("/api/customers", customerData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const response = await authAPI.put(`/api/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const deleteCustomer = async (id) => {
  try {
    const response = await authAPI.delete(`/api/customers/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Tables
export const getTables = async () => {
  try {
    const response = await authAPI.get("/api/staff/tables");
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getTableDishes = async (tableId) => {
  try {
    const response = await authAPI.get(`/api/staff/tables/${tableId}/dishes`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateTableStatus = async (tableId, status) => {
  try {
    const response = await authAPI.put(`/api/staff/tables/${tableId}`, {
      status,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Orders
export const getOrders = async () => {
  try {
    const response = await publicAPI.get("/api/orders");
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getOrderById = async (orderId) => {
  try {
    const response = await publicAPI.get(`/api/orders/${orderId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await publicAPI.post("/api/orders", orderData);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await authAPI.put(`/api/staff/orders/${orderId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

// Payments
export const initiateVNPayPayment = async (paymentData) => {
  try {
    const response = await publicAPI.post(
      "/api/payment/vnpay_payment",
      paymentData
    );
    return response.data;
  } catch (error) {
    handleApiError(error);
    if (error.response?.status === 400) {
      throw new Error("Yêu cầu thanh toán không hợp lệ");
    } else if (error.response?.status === 503) {
      throw new Error("Cổng thanh toán không khả dụng");
    }
    throw error;
  }
};

export const getPaymentStatus = async (orderId) => {
  try {
    const response = await publicAPI.get(`/api/payment/status/${orderId}`);
    return response.data;
  } catch (error) {
    handleApiError(error);
    if (error.response?.status === 404) {
      throw new Error("Không tìm thấy thanh toán cho mã đơn hàng này");
    } else if (error.response?.status === 400) {
      throw new Error("Yêu cầu trạng thái thanh toán không hợp lệ");
    }
    throw error;
  }
};

// Helpers
const handleApiError = (error) => {
  if (error.response) {
    console.error("Lỗi phản hồi API:", {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers,
    });
  } else if (error.request) {
    console.error("Lỗi yêu cầu API:", error.request);
  } else {
    console.error("Lỗi API:", error.message);
  }
};

export const getCurrentUser = () => {
  return {
    username: localStorage.getItem("username"),
    userType: localStorage.getItem("userType"),
    staffId: localStorage.getItem("staffId"),
  };
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("accessToken");
};

export const hasRole = (role) => {
  const userType = localStorage.getItem("userType");
  return userType === role;
};

export { authAPI, publicAPI };
