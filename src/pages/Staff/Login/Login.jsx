import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: "http://localhost:8080", // Change this to match your backend URL
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // Important for CORS with credentials if your API requires it
});

const Login = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      // Validate inputs
      if (!userId || !password) {
        setError("Please enter both User ID and Password");
        setLoading(false);
        return;
      }

      // Create request body according to LoginRequestDto expected by the API
      const loginRequest = {
        login: userId,
        password: password,
      };

      console.log("Attempting login with:", { username: userId });

      // Call the login API endpoint
      const response = await api.post("/api/auth/login", loginRequest);

      console.log("Login response:", response);

      // Handle successful login
      const authData = response.data;

      // Store tokens in localStorage
      localStorage.setItem("accessToken", authData.accessToken);
      if (authData.refreshToken) {
        localStorage.setItem("refreshToken", authData.refreshToken);
      }

      // Set authorization header for future requests
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${authData.accessToken}`;

      console.log("Login successful", authData);
      navigate("/order-management");

      // Redirect to dashboard or home page after successful login
      // window.location.href = '/dashboard'; // Uncomment to redirect
    } catch (error) {
      console.error("Login failed:", error);

      // Handle different error scenarios
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 403) {
          setError(
            "Access forbidden. Please check your credentials or permissions."
          );
        } else if (error.response.status === 401) {
          setError("Invalid username or password.");
        } else {
          setError(
            error.response.data?.message || "Login failed. Please try again."
          );
        }
        console.log("Error response data:", error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        setError("No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      // In a real implementation, you would integrate with Google OAuth
      // For now, we'll just show a placeholder
      alert("Google login integration will be implemented here");

      // Actual Google login would get a token and then call:
      // const response = await api.post('/api/auth/staff/google-login', { token: googleToken });
    } catch (error) {
      console.error("Google login failed:", error);
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!userId) {
      setError("Please enter your User ID to reset password");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/auth/forgot-password", {
        email: userId, // Assuming userId is used as email for password reset
      });

      alert(
        "If your account exists, password reset instructions have been sent to your email."
      );
    } catch (error) {
      console.error("Forgot password request failed:", error);
      // Intentionally don't show specific errors for security reasons
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-screen w-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage: "url('./src/assets/img/Login.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "none",
      }}
    >
      {/* Lớp làm mờ nền */}
      <div className="absolute inset-0 bg-opacity-30 backdrop-blur-sm"></div>

      {/* Modal đăng nhập */}
      <div className="relative z-10 bg-gradient-to-b from-blue-100 to-red-300 rounded-3xl overflow-hidden flex w-full max-w-4xl mx-4">
        {/* Phần bên trái - Form đăng nhập */}
        <div className="w-1/2 p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full border border-gray-300 flex items-center justify-center relative">
              <img
                src="./src/assets/img/logoremovebg.png"
                alt="Fork and knife"
                className="w-24 h-20 absolute"
              />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-1">Sign In</h1>
          <p className="text-center text-gray-600 text-sm mb-6">
            Have a great day!
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 mb-1 text-sm">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-100"
              placeholder="BonAppetit1..."
            />
          </div>

          <div className="mb-2">
            <label className="block text-gray-700 mb-1 text-sm">Password</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-100"
                placeholder="BonAppetit1234..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 text-gray-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  {showPassword ? (
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  ) : (
                    <path d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" />
                  )}
                </svg>
              </button>

              {/* QR code button */}
              <button
                type="button"
                className="ml-2 p-1 border border-gray-300 rounded bg-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </button>
            </div>
            <div className="text-right mt-1">
              <a
                href="#"
                className="text-xs text-gray-500 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  handleForgotPassword();
                }}
              >
                Forgot Password?
              </a>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full !bg-black text-white py-2 rounded-lg hover:bg-gray-800 mt-4 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="px-3 text-xs text-gray-500">Or</div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <button
            className={`w-full !bg-black text-white py-2 rounded-lg hover:bg-gray-800 flex items-center justify-center ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img
              src="./src/assets/img/gg.webp"
              alt="Google"
              className="w-4 h-4 mr-2"
            />
            <span className="text-sm">Login with Google</span>
          </button>
        </div>

        {/* Phần bên phải - Hình ảnh thức ăn */}
        <div
          className="w-1/2 bg-cover bg-center relative flex items-start justify-center rounded-3xl overflow-hidden border-6 border-white shadow-md"
          style={{ backgroundImage: "url('./src/assets/img/Login.png')" }}
        >
          <div className="absolute top-6 text-center text-white">
            <h2 className="text-xl font-bold">
              Top Quality - Dedicated Service!
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
