import axios from "axios";

// Lấy URL cơ sở của API từ biến môi trường
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Tạo instance axios cho các yêu cầu cần xác thực
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // Timeout 15 giây
});

// Tạo instance axios cho các yêu cầu công khai (không cần Authorization header)
const publicAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // Timeout 30 giây cho các API payment
});

// Interceptor yêu cầu cho authAPI - thêm token vào các yêu cầu trừ các endpoint công khai
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    // Danh sách các endpoint công khai không cần token
    const publicEndpoints = [
      "/api/payment", // Tất cả API payment đều công khai
      "/api/auth/login",
      "/api/auth/forgot-password",
      "/api/auth/refresh-token",
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
    return config;
  },
  (error) => Promise.reject(error)
);

publicAPI.interceptors.request.use(
  (config) => {
    console.log("PublicAPI Request Headers:", config.headers);
    console.log("Request URL:", config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor phản hồi để xử lý làm mới token và lỗi xác thực
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Khởi tạo _retry nếu chưa được thiết lập
    if (!originalRequest._retry) {
      originalRequest._retry = false;
    }

    // Xử lý lỗi 401 cho các endpoint không công khai
    const publicEndpoints = [
      "/api/payment",
      "/api/auth/login",
      "/api/auth/forgot-password",
      "/api/auth/refresh-token",
      "/api/customers",
      "/api/images",
      "/api/orders",
      "/api/dishes",
      "/api/notifications",
      "/api/categories",
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
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Sử dụng publicAPI để làm mới token, tránh vòng lặp interceptor
        const refreshResponse = await publicAPI.post(
          "/api/auth/refresh-token",
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        if (refreshResponse.data.accessToken) {
          localStorage.setItem("accessToken", refreshResponse.data.accessToken);
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem(
              "refreshToken",
              refreshResponse.data.refreshToken
            );
          }

          // Thử lại yêu cầu ban đầu với token mới
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
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Xử lý lỗi 403 Forbidden
    if (error.response?.status === 403) {
      console.error("Không có quyền truy cập tài nguyên này.");
    }

    return Promise.reject(error);
  }
);

// ===================== Xác Thực ===================== //
export const login = async (login, password) => {
  try {
    const response = await publicAPI.post("/auth/login", {
      login,
      password,
    });
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
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userType");
    return response.data;
  } catch (error) {
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
    const response = await publicAPI.post("/auth/forgot-password", {
      login,
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

// ===================== Nhân Viên ===================== //
export const getStaff = async () => {
  try {
    const response = await authAPI.get("/api/staff");
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

// ===================== Khách Hàng ===================== //
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

// ===================== Bàn Ăn ===================== //
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

// ===================== Đơn Hàng ===================== //
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

// ===================== Thanh Toán ===================== //
export const initiateVNPayPayment = async (paymentData) => {
  try {
    const response = await publicAPI.post(
      "/api/payment/vnpay_payment",
      paymentData
    );
    return response.data; // Trả về URL thanh toán hoặc chi tiết giao dịch
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

// ===================== Hàm Hỗ Trợ ===================== //

// Xử lý lỗi API để chuẩn hóa ghi log và xử lý
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

// Hàm hỗ trợ xác thực
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

export { authAPI, publicAPI };
