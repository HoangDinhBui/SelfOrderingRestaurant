import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    try {
      setError("");
      setLoading(true);

      // Validate inputs
      if (!userId || !password) {
        setError("Please enter both User ID and Password");
        setLoading(false);
        return;
      }

      // Simulate successful login
      console.log("Login successful");

      // Redirect to dashboard after successful login
      navigate("/table-management");
    } catch (error) {
      console.error("Login failed:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      setError("");
      setLoading(true);
      alert("Google login integration will be implemented here");
    } catch (error) {
      console.error("Google login failed:", error);
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!userId) {
      setError("Please enter your User ID to reset password");
      return;
    }

    try {
      setLoading(true);
      alert(
        "If your account exists, password reset instructions have been sent to your email."
      );
    } catch (error) {
      console.error("Forgot password request failed:", error);
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
      <div
        className="relative z-10 rounded-3xl overflow-hidden flex w-full max-w-4xl mx-4"
        style={{
          background: "linear-gradient(to bottom, #B1DCE0, #C08E8C)",
        }}
      >
        {/* Phần bên trái - Form đăng nhập */}
        <div className="w-1/2 p-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full border border-gray-400 flex items-center justify-center relative">
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
            <label className="block text-gray-800 mb-1 text-l"><i>User ID</i></label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ backgroundColor: "#D9D9D9" }}
              placeholder="BonAppetit1..."
            />
          </div>

          <div className="mb-2">
            <div className="mb-2">
              <label className="block text-gray-800 mb-1 text-l"><i>
                Password </i>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  style={{ backgroundColor: "#D9D9D9" }}
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
                  className="text-gray-400 hover:text-gray-600 px-2 py-1 rounded"
                  style={{ backgroundColor: "#D9D9D9" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {showPassword ? (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c-7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    )}
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
          </div>
          <div className="flex flex-col items-center">
            <button
              onClick={handleLogin}
              disabled={loading}
              className={`w-64 !bg-black text-white py-2 rounded-lg hover:bg-gray-800 mt-4 text-sm ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <div className="flex items-center my-4 w-64">
              <div className="flex-1 border-t border-gray-400"></div>
              <div className="px-3 text-xs text-gray-500">Or</div>
              <div className="flex-1 border-t border-gray-400"></div>
            </div>

            <button
              className={`w-64 !bg-black text-white py-2 rounded-lg hover:bg-gray-800 flex items-center justify-center text-sm ${
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
              <span>Login with Google</span>
            </button>
          </div>
        </div>

        {/* Phần bên phải - Hình ảnh thức ăn */}
        <div
          className="w-1/2 border-white border-1 bg-cover bg-center relative flex items-start justify-center rounded-3xl overflow-hidden shadow-md"
          style={{ backgroundImage: "url('./src/assets/img/Login.png')" }}
        >
          <div className="absolute top-6 text-center text-white">
            <h2 className="text-xl font-bold p-6">
              Top Quality - Dedicated Service!
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;