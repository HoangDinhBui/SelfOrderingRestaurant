import axios from "axios";

// Cấu hình Axios với URL cơ sở
const instance = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000,
});

// Interceptor cho request - thêm token vào header nếu có
instance.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem("token");

    // Nếu có token, thêm vào header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho response - xử lý các lỗi phổ biến
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi 403 - Forbidden
    if (error.response && error.response.status === 403) {
      console.log("Lỗi xác thực: Bạn không có quyền truy cập tài nguyên này");

      // Nếu đang ở trang admin/staff và không có quyền, có thể chuyển hướng về trang login
      const currentPath = window.location.pathname;
      if (
        currentPath.includes("/admin") ||
        currentPath.includes("/staff") ||
        currentPath.includes("/dish-management") ||
        currentPath.includes("/table-management")
      ) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }

    // Xử lý lỗi 401 - Unauthorized
    if (error.response && error.response.status === 401) {
      console.log("Phiên đăng nhập hết hạn hoặc không hợp lệ");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default instance;
