import axios from "axios";

// Cấu hình Axios với URL cơ sở
const API_BASE_URL = "http://localhost:8080/api";

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

const publicAPI = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor cho request - thêm token vào header nếu có
authAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const publicEndpoints = [
      "/api/payment/vnpay_payment",
      "/api/auth/login",
      "/api/auth/forgot-password",
      "/api/auth/refresh-token",
      "/api/customer",
      "/api/images",
      "/api/payment",
      "/api/orders",
      "/api/dishes",
      "/api/notifications",
      "/api/category",
    ];
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url.includes(endpoint)
    );
    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor cho response - xử lý các lỗi phổ biến
authAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Initialize _retry if not set
    if (!originalRequest._retry) {
      originalRequest._retry = false;
    }

    // Handle 401 errors for non-public endpoints
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/api/payment/vnpay_payment") &&
      !originalRequest.url.includes("/api/auth/")
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Use publicAPI for refresh token
        const refreshResponse = await publicAPI.post(
          "/auth/refresh-token",
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        if (refreshResponse.data.accessToken) {
          localStorage.setItem("token", refreshResponse.data.accessToken);
          if (refreshResponse.data.refreshToken) {
            localStorage.setItem(
              "refreshToken",
              refreshResponse.data.refreshToken
            );
          }

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          return authAPI(originalRequest);
        } else {
          throw new Error("No access token received");
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      console.error("Lỗi xác thực: Bạn không có quyền truy cập tài nguyên này");
      if (
        window.location.pathname.includes("/admin") ||
        window.location.pathname.includes("/staff") ||
        window.location.pathname.includes("/dish-management") ||
        window.location.pathname.includes("/table-management")
      ) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export { authAPI, publicAPI };
