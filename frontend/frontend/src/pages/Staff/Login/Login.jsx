import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { login, googleLogin, forgotPassword } from "../../../services/api";
import axios from "axios"; // Make sure axios is installed

const Login = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false); // State to toggle form mode
  const [showOtpModal, setShowOtpModal] = useState(false); // State for OTP modal
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false); // State for New Password modal
  const [otp, setOtp] = useState(["", "", "", "", "", ""]); // State for 6-digit OTP
  const [newPassword, setNewPassword] = useState(""); // State for new password
  const [confirmPassword, setConfirmPassword] = useState(""); // State for confirm password
  const [newPasswordError, setNewPasswordError] = useState(""); // State for new password error
  const otpInputs = useRef([]); // Ref for OTP input elements

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      if (!userId || !password) {
        setError("Please enter both Username and Password");
        setLoading(false);
        return;
      }

      const response = await login(userId, password);

      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("username", response.username);
      localStorage.setItem("userType", response.userType);

      console.log("Login successful");

      switch (response.userType) {
        case "ADMIN":
          navigate("/table-management_admin");
          break;
        case "STAFF":
          navigate("/table-management_staff");
          break;
        default:
          navigate("/table-management_staff");
      }
    } catch (error) {
      console.error("Login failed:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Invalid username or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      const tokenId = "google-oauth-token";

      const response = await googleLogin(tokenId);

      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      localStorage.setItem("username", response.username);
      localStorage.setItem("userType", response.userType);

      switch (response.userType) {
        case "ADMIN":
          navigate("/admin-dashboard");
          break;
        case "STAFF":
          navigate("/staff-dashboard");
          break;
        default:
          navigate("/table-management");
      }
    } catch (error) {
      console.error("Google login failed:", error);
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setShowOtpModal(true); // Show OTP modal immediately on click

    if (!userId || !password) {
      setError("Please enter both Username and Email to reset password");
      return;
    }

    try {
      setLoading(true);
      const response = await forgotPassword({ username: userId, email: password });
      console.log("OTP sent successfully:", response);
    } catch (error) {
      console.error("Forgot password request failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/, ""); // Allow only digits
    setOtp(newOtp);

    // Move focus to next input
    if (value && index < 5 && otpInputs.current[index + 1]) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleOtpSubmit = () => {
    const otpCode = otp.join("");
    if (otpCode.length === 6 && /^\d{6}$/.test(otpCode)) {
      console.log("OTP submitted:", otpCode);
      setShowOtpModal(false); // Close OTP modal
      setShowNewPasswordModal(true); // Open New Password modal
      setOtp(["", "", "", "", "", ""]); // Reset OTP
    } else {
      setError("Please enter a valid 6-digit OTP");
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const response = await forgotPassword({ username: userId, email: password });
      console.log("OTP resent successfully:", response);
      alert("OTP resent to your email.");
    } catch (error) {
      console.error("Failed to resend OTP:", error);
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordSubmit = async () => {
    setNewPasswordError("");

    // Basic validation
    if (!newPassword || !confirmPassword) {
      setNewPasswordError("Please enter and confirm your new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setNewPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setNewPasswordError("Password must be at least 8 characters long");
      return;
    }

    try {
      setLoading(true);
      // Replace this with your actual API call to reset the password
      await axios.post("/api/reset-password", {
        username: userId,
        newPassword: newPassword,
      });
      console.log("Password reset successfully");
      setShowNewPasswordModal(false);
      setIsForgotPassword(false); // Return to login mode
      setError(""); // Clear any errors
      setNewPassword("");
      setConfirmPassword("");
      alert("Password reset successfully. Please log in with your new password.");
    } catch (error) {
      console.error("Failed to reset password:", error);
      setNewPasswordError("Failed to reset password. Please try again.");
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
      <div className="absolute inset-0 bg-opacity-30 backdrop-blur-sm"></div>

      <div
        className="relative z-10 rounded-3xl overflow-hidden flex w-full max-w-4xl mx-4"
        style={{ background: "linear-gradient(to bottom, #B1DCE0, #C08E8C)" }}
      >
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

          <h1 className="text-l font-bold text-center mb-1">
            {isForgotPassword ? "" : "Sign In"}
          </h1>
          <p className="text-center text-gray-600 text-l mb-6">
            {isForgotPassword ? "Enter your username and email to reset your password." : "Have a great day!"}
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-800 mb-1 text-l">
              <i>{isForgotPassword ? "Username" : "Username"}</i>
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ backgroundColor: "#D9D9D9" }}
              placeholder={isForgotPassword ? "Bonappetit1.." : "BonAppetit1..."}
            />
          </div>

          <div className="mb-2">
            <div className="mb-2">
              <label className="block text-gray-800 mb-1 text-l">
                <i>{isForgotPassword ? "Email" : "Password"}</i>
              </label>
              <div className="flex items-center space-x-2">
                {isForgotPassword ? (
                  <input
                    type="email"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    style={{ backgroundColor: "#D9D9D9" }}
                    placeholder="Bonappetit@email.com"
                  />
                ) : (
                  <>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      style={{ backgroundColor: "#D9D9D9" }}
                      placeholder="BonAppetit1234..."
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
                  </>
                )}
              </div>
              <div className="text-right mt-1">
                <a
                  href="#"
                  className="text-xs text-gray-500 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsForgotPassword(!isForgotPassword);
                    setError(""); // Clear any existing errors
                  }}
                >
                  {isForgotPassword ? "Back to Sign In" : "Forgot Password?"}
                </a>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <button
              onClick={isForgotPassword ? handleForgotPassword : handleLogin}
              disabled={loading}
              className={`w-64 !bg-black text-white py-2 rounded-lg hover:bg-gray-800 mt-4 text-sm ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (isForgotPassword ? "Sending..." : "Signing in...") : (isForgotPassword ? "Send OTP" : "Sign in")}
            </button>

            {!isForgotPassword && (
              <>
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
                  <img src="./src/assets/img/gg.webp" alt="Google" className="w-4 h-4 mr-2" />
                  <span>Login with Google</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div
          className="w-1/2 border-white border-1 bg-cover bg-center relative flex items-start justify-center rounded-3xl overflow-hidden shadow-md"
          style={{ backgroundImage: "url('./src/assets/img/Login.png')" }}
        >
          <div className="absolute top-6 text-center text-white">
            <h2 className="text-xl font-bold p-6">Top Quality - Dedicated Service!</h2>
          </div>
        </div>

        {/* OTP Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 flex items-center justify-center z-20">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <div className="flex justify-between items-center mb-4">
                <h2 className="flex justify-between text-lg font-semibold">Let's verify account</h2>
                <button
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtp(["", "", "", "", "", ""]); // Reset OTP
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-4">We sent a code to your email to verify account</p>
              <div className="flex justify-center space-x-2 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputs.current[index] = el)}
                    id={`otp-input-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-12 h-12 text-center text-xl border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digit && index > 0) {
                        otpInputs.current[index - 1].focus();
                      }
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleOtpSubmit}
                  className="px-4 py-2 text-white rounded-lg hover:bg-blue-600"
                  style={{ backgroundColor: "#7F8CAA" }}
                >
                  Verify account
                </button>
              </div>
              <div className="text-center mt-4 text-sm text-gray-500">
                Didn't receive code?
                <a href="#" onClick={handleResendOtp}> Resend code</a>
              </div>
            </div>
          </div>
        )}

        {/* New Password Modal */}
        {showNewPasswordModal && (
          <div className="fixed inset-0 flex items-center justify-center z-20">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Set New Password</h2>
                <button
                  onClick={() => {
                    setShowNewPasswordModal(false);
                    setNewPassword("");
                    setConfirmPassword("");
                    setNewPasswordError("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {newPasswordError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                  {newPasswordError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-800 mb-1 text-sm">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-800 mb-1 text-sm">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleNewPasswordSubmit}
                  disabled={loading}
                  className={`px-4 py-2 text-white rounded-lg hover:bg-blue-600 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  style={{ backgroundColor: "#7F8CAA" }}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;