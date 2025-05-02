import api from "../axiosConfig";

class AuthService {
  // Login with username/email and password
  async login(login, password) {
    try {
      const response = await api.post("/auth/login", {
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
      let message = "Failed to login. Please try again.";
      if (status === 401) {
        message = "Invalid username or password.";
      } else if (status === 400) {
        message = error.response?.data?.message || "Invalid login request.";
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
        "Failed to login with Google. Please try again.";
      throw new Error(message);
    }
  }

  // Logout
  async logout() {
    try {
      await api.post("/auth/logout");
      // Clear local storage
      this.clearLocalStorage();
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      // Clear storage even if API call fails
      this.clearLocalStorage();
      return {
        success: false,
        message: "Logout failed, but local data cleared.",
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
      await api.post("/auth/forgot-password", { login });
      return { success: true, message: "Password reset link sent." };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to request password reset. Please try again.";
      throw new Error(message);
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const response = await api.post("/auth/refresh-token", {
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
        error.response?.data?.message || "Failed to refresh token.";
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
