import api from "../axiosConfig";

class AuthService {
  // Login with username/email and password
  async login(login, password) {
    try {
      const response = await api.post("/api/auth/login", {
        login,
        password,
      });
      // Store tokens and user info in localStorage
      const { accessToken, refreshToken, username, userType } = response.data;
      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (username) localStorage.setItem("username", username);
      if (userType) localStorage.setItem("userType", userType);
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      let message = "Đăng nhập thất bại. Vui lòng thử lại.";
      if (status === 401) {
        message = "Sai tên đăng nhập hoặc mật khẩu.";
      } else if (status === 400) {
        message = error.response?.data?.message || "Yêu cầu đăng nhập không hợp lệ.";
      }
      throw new Error(message);
    }
  }

  // Login with Google
  async googleLogin(tokenId) {
    try {
      const response = await api.post("/auth/staff/google-login", {
        tokenId,
      });
      // Store tokens and user info in localStorage
      const { accessToken, refreshToken, username, userType } = response.data;
      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (username) localStorage.setItem("username", username);
      if (userType) localStorage.setItem("userType", userType);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Không đăng nhập được bằng Google. Vui lòng thử lại.";
      throw new Error(message);
    }
  }

  // Logout
  async logout() {
    try {
      await api.post("/api/auth/logout", { refreshToken: localStorage.getItem("refreshToken") });
      // Clear local storage
      this.clearLocalStorage();
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      // Clear storage even if API call fails
      this.clearLocalStorage();
      return {
        success: false,
        message: "Đăng xuất lỗi, nhưng dữ liệu trên máy đã được xóa.",
      };
    }
  }

  // Helper method to clear localStorage
  clearLocalStorage() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    localStorage.removeItem("userType");
  }

  // Request password reset
  async forgotPassword(login) {
    try {
      await api.post("/api/auth/forgot-password", { login });
      return { success: true, message: "Đã gửi liên kết đặt lại mật khẩu." };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Không gửi được yêu cầu đặt lại mật khẩu. Vui lòng thử lại.";
      throw new Error(message);
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const response = await api.post("/api/auth/refresh-token", {
        refreshToken,
      });
      // Update tokens in localStorage
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      if (accessToken) localStorage.setItem("accessToken", accessToken);
      if (newRefreshToken)
        localStorage.setItem("refreshToken", newRefreshToken);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Không làm mới được phiên đăng nhập.";
      throw new Error(message);
    }
  }

  // Get current user info from localStorage
  getCurrentUser() {
    return {
      username: localStorage.getItem("username"),
      userType: localStorage.getItem("userType"),
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem("accessToken");
  }

  // Check if user has specific role
  hasRole(role) {
    const userType = localStorage.getItem("userType");
    return userType === role;
  }
}

export default new AuthService();
