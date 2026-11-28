import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { login, googleLogin, forgotPassword } from "../../../services/api";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { BACKEND_URL } from "../../../config";

const decodeJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

// Persist what the staff/admin pages read. staffId and fullname come with the login response;
// userId is a claim of the access token (used to open the notification WebSocket).
const storeSession = (response) => {
  localStorage.setItem("accessToken", response.accessToken);
  localStorage.setItem("refreshToken", response.refreshToken);
  localStorage.setItem("username", response.username);
  localStorage.setItem("userType", response.userType);
  if (response.staffId != null)
    localStorage.setItem("staffId", response.staffId);
  if (response.fullname) localStorage.setItem("fullname", response.fullname);
  try {
    const payload = JSON.parse(
      atob(
        response.accessToken
          .split(".")[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/"),
      ),
    );
    if (payload.userId != null) localStorage.setItem("userId", payload.userId);
  } catch {
    // malformed token: the API will reject it anyway
  }
  axios.defaults.headers.common["Authorization"] =
    `Bearer ${response.accessToken}`;
};

const Login = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const otpInputs = useRef([]);

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      if (!userId || !password) {
        setError("Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu");
        toast.error("Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu");
        setLoading(false);
        return;
      }

      const response = await login(userId, password);

      // Validate API response
      if (
        !response.accessToken ||
        !response.refreshToken ||
        !response.username
      ) {
        throw new Error(
          "Phản hồi từ máy chủ không hợp lệ: Thiếu thông tin bắt buộc",
        );
      }

      storeSession(response);

      toast.success("Đăng nhập thành công!");

      // Navigate based on userType
      switch (response.userType) {
        case "ADMIN":
          navigate("/table-management_admin", { replace: true });
          break;
        case "STAFF":
          navigate("/attendance", { replace: true });
          break;
        default:
          setError(
            "Loại tài khoản không xác định. Vui lòng liên hệ bộ phận hỗ trợ.",
          );
          toast.error(
            "Loại tài khoản không xác định. Vui lòng liên hệ bộ phận hỗ trợ.",
          );
          setLoading(false);
          return;
      }
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      const tokenId = "google-oauth-token"; // Replace with actual Google OAuth token
      const response = await googleLogin(tokenId);

      // Validate API response
      if (
        !response.accessToken ||
        !response.refreshToken ||
        !response.username ||
        !response.userType
      ) {
        throw new Error(
          "Phản hồi từ máy chủ không hợp lệ: Thiếu thông tin bắt buộc",
        );
      }

      storeSession(response);

      toast.success("Đăng nhập Google thành công!");

      // Navigate based on userType
      switch (response.userType) {
        case "ADMIN":
          navigate("/table-management_admin", { replace: true });
          break;
        case "STAFF":
          navigate("/attendance", { replace: true });
          break;
        default:
          setError(
            "Loại tài khoản không xác định. Vui lòng liên hệ bộ phận hỗ trợ.",
          );
          toast.error(
            "Loại tài khoản không xác định. Vui lòng liên hệ bộ phận hỗ trợ.",
          );
          setLoading(false);
          return;
      }
    } catch (error) {
      console.error("Google login failed:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Đăng nhập Google thất bại. Vui lòng thử lại.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!userId || !email) {
      setError("Vui lòng nhập cả Tên đăng nhập và Email để đặt lại mật khẩu");
      toast.error(
        "Vui lòng nhập cả Tên đăng nhập và Email để đặt lại mật khẩu",
      );
      return;
    }

    try {
      setLoading(true);
      await forgotPassword({ username: userId, email });
      setShowOtpModal(true);
      setError("");
      toast.success("Đã gửi mã OTP thành công!");
      console.log("OTP sent successfully");
    } catch (error) {
      console.error("Forgot password request failed:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Không thể gửi mã OTP. Vui lòng kiểm tra lại tên đăng nhập và email.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/, "");
    setOtp(newOtp);

    if (value && index < 5 && otpInputs.current[index + 1]) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleOtpSubmit = () => {
    const otpCode = otp.join("");
    if (otpCode.length === 6 && /^\d{6}$/.test(otpCode)) {
      setShowOtpModal(false);
      setShowNewPasswordModal(true);
      setError("");
    } else {
      setError("Vui lòng nhập đúng mã OTP gồm 6 chữ số");
      toast.error("Vui lòng nhập đúng mã OTP gồm 6 chữ số");
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      await forgotPassword({ username: userId, email });
      console.log("OTP resent successfully");
      toast.success("Đã gửi lại mã OTP đến email của bạn!");
    } catch (error) {
      console.error("Failed to resend OTP:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Không thể gửi lại mã OTP. Vui lòng thử lại.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordSubmit = async () => {
    setNewPasswordError("");

    if (!newPassword || !confirmPassword) {
      setNewPasswordError("Vui lòng nhập và xác nhận mật khẩu mới");
      toast.error("Vui lòng nhập và xác nhận mật khẩu mới");
      return;
    }

    if (newPassword !== confirmPassword) {
      setNewPasswordError("Mật khẩu xác nhận không khớp");
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (newPassword.length < 8) {
      setNewPasswordError("Mật khẩu phải có ít nhất 8 ký tự");
      toast.error("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }

    try {
      setLoading(true);
      const otpCode = otp.join("");
      await axios.post(`${BACKEND_URL}/api/auth/reset-password`, {
        otp: otpCode,
        newPassword,
      });
      console.log("Password reset successfully");
      toast.success(
        "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
      );
      setShowNewPasswordModal(false);
      setIsForgotPassword(false);
      setNewPassword("");
      setConfirmPassword("");
      setOtp(["", "", "", "", "", ""]);
      setEmail("");
      setError("");
    } catch (error) {
      console.error("Failed to reset password:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Không thể đặt lại mật khẩu. Vui lòng thử lại.";
      setNewPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const serifFont = {
    fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
  };
  const sansFont = {
    fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, sans-serif",
  };
  const goldLogoStyle = {
    filter:
      "brightness(0) saturate(100%) invert(78%) sepia(28%) saturate(547%) hue-rotate(359deg) brightness(96%) contrast(94%) drop-shadow(0 2px 12px rgba(212, 175, 106, 0.28))",
  };

  return (
    <div
      className="h-screen w-screen overflow-y-auto lg:overflow-hidden relative flex flex-col lg:flex-row bg-[#080809] text-[#F3EFE6]"
      style={sansFont}
    >
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      {/* Ảnh nền toàn màn hình giữ nguyên từ code gốc */}
      <div
        className="fixed inset-0 bg-cover bg-center pointer-events-none z-0"
        style={{
          backgroundImage: `url(/img/loginBGNew.jpg)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "none",
        }}
      />

      {/* Lớp blur lan dần từ giữa sang vùng login 42% bên phải */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          maskImage:
            "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 38%, rgba(0,0,0,0.72) 58%, rgba(0,0,0,1) 76%)",
          WebkitMaskImage:
            "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 38%, rgba(0,0,0,0.72) 58%, rgba(0,0,0,1) 76%)",
        }}
      />

      {/* Lớp tối dần sang phía khung login 42% bên phải (không tách ô rời) */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,8,9,0.72) 0%, rgba(8,8,9,0.32) 38%, rgba(8,8,9,0.78) 58%, rgba(8,8,9,0.95) 100%)",
        }}
      />

      {/* Khu vực nội dung chính bên trái: 58% màn hình */}
      <div className="relative z-10 w-full lg:w-[58%] min-h-[340px] lg:h-full flex flex-col justify-center px-8 sm:px-14 lg:px-20 py-10">
        <div className="max-w-xl">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full border border-[#D4AF6A]/45 bg-[#19150E]/60 text-[#DFBE7E] text-[11px] font-medium tracking-[0.18em] uppercase mb-5">
            ẨM THỰC TINH HOA • PARIS
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-[52px] leading-[1.2] font-semibold text-[#F8F5EE] mb-5"
            style={serifFont}
          >
            Nghệ Thuật Ẩm Thực
            <br />
            &amp; Đẳng Cấp Phục Vụ
          </h1>

          <div className="w-12 h-[1.5px] bg-[#D4AF6A]/75 mb-5" />

          <p className="text-sm sm:text-[15px] leading-relaxed text-[#E2DDD2] max-w-md mb-6">
            Cổng thông tin quản trị và điều phối bàn tiệc tập trung dành riêng
            cho Đội ngũ Phục vụ &amp; Ban Quản lý Nhà hàng Bon Appétit.
          </p>

          <div className="flex items-center gap-3 text-xs sm:text-[13px] text-[#B5AFA2] italic">
            <span className="w-[2px] h-4 bg-[#D4AF6A]/80 inline-block" />
            <span style={serifFont}>
              &ldquo;Chỉn chu trong từng chi tiết • Phục vụ bằng trọn tâm
              huyết&rdquo;
            </span>
          </div>
        </div>
      </div>

      {/* Khu vực đăng nhập bên phải: chiếm 42% màn hình, hòa trực tiếp vào nền blur + tối dần */}
      <div className="relative z-10 w-full lg:w-[42%] lg:h-full bg-transparent flex flex-col justify-between px-8 sm:px-14 lg:px-16 py-7">
        <div className="hidden lg:block h-2" />

        {/* Nội dung form */}
        <div className="my-auto py-3 max-w-md w-full mx-auto">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <img
                src="/img/logoremovebg.png"
                alt="Logo Bon Appétit"
                className="h-24 w-24 sm:h-28 sm:w-28 object-contain select-none"
                style={goldLogoStyle}
              />
            </div>

            <h2
              className="text-[28px] font-semibold text-[#F8F5EE] tracking-wide"
              style={serifFont}
            >
              Bon Appétit
            </h2>
            <p className="text-[10px] font-medium tracking-[0.24em] text-[#D4AF6A] uppercase mt-1">
              ẨM THỰC TINH HOA • PARIS
            </p>
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full border border-white/15 bg-black/35 text-[10px] tracking-[0.14em] text-[#C4BEB2] uppercase">
              {isForgotPassword
                ? "KHÔI PHỤC MẬT KHẨU TÀI KHOẢN"
                : "HỆ THỐNG NỘI BỘ DÀNH CHO NHÂN SỰ"}
            </div>
          </div>

          {error && (
            <div className="bg-red-950/75 border border-red-500/45 text-red-200 px-3.5 py-2.5 rounded-md mb-4 text-xs">
              {error}
            </div>
          )}

          {isForgotPassword ? (
            <>
              <div className="mb-4">
                <label className="block text-[10px] font-medium tracking-[0.15em] text-[#B4AEA2] uppercase mb-2">
                  TÊN ĐĂNG NHẬP
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#8E887C] pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-md bg-black/45 border border-white/15 text-sm text-[#F3EFE6] placeholder-[#736E65] focus:outline-none focus:border-[#D4AF6A]/75 transition-colors"
                    placeholder="BonAppetit1..."
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-[10px] font-medium tracking-[0.15em] text-[#B4AEA2] uppercase mb-2">
                  EMAIL XÁC THỰC
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#8E887C] pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-md bg-black/45 border border-white/15 text-sm text-[#F3EFE6] placeholder-[#736E65] focus:outline-none focus:border-[#D4AF6A]/75 transition-colors"
                    placeholder="Bonappetit@email.com"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-[10px] font-medium tracking-[0.15em] text-[#B4AEA2] uppercase mb-2">
                  TÊN ĐĂNG NHẬP
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#8E887C] pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-md bg-black/45 border border-white/15 text-sm text-[#F3EFE6] placeholder-[#736E65] focus:outline-none focus:border-[#D4AF6A]/75 transition-colors"
                    placeholder="BA-8839"
                  />
                </div>
              </div>

              <div className="mb-1.5">
                <label className="block text-[10px] font-medium tracking-[0.15em] text-[#B4AEA2] uppercase mb-2">
                  MẬT KHẨU BẢO MẬT
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#8E887C] pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-md bg-black/45 border border-white/15 text-sm text-[#F3EFE6] placeholder-[#736E65] focus:outline-none focus:border-[#D4AF6A]/75 transition-colors"
                    placeholder="BonAppetit2024@"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#8E887C] hover:text-[#D4AF6A] transition-colors"
                    aria-label="Ẩn hoặc hiện mật khẩu"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
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
              </div>
            </>
          )}

          <div className="mt-2 mb-5">
            <a
              href="#"
              className="text-xs text-[#D4AF6A]/90 hover:text-[#E7C98C] transition-colors"
              onClick={(e) => {
                e.preventDefault();
                setIsForgotPassword(!isForgotPassword);
                setError("");
                setEmail("");
                setPassword("");
              }}
            >
              {isForgotPassword ? "Quay lại đăng nhập" : "Quên mật khẩu?"}
            </a>
          </div>

          <button
            onClick={isForgotPassword ? handleForgotPassword : handleLogin}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-md border border-[#D4AF6A]/60 bg-[#2C2314]/85 hover:bg-[#3A2E1A] text-[#E8CA8E] text-xs font-semibold tracking-[0.16em] uppercase flex items-center justify-center gap-2 transition-all ${
              loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <span>
              {loading
                ? isForgotPassword
                  ? "ĐANG GỬI MÃ..."
                  : "ĐANG ĐĂNG NHẬP..."
                : isForgotPassword
                  ? "GỬI MÃ OTP"
                  : "ĐĂNG NHẬP HỆ THỐNG"}
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {/* Chân trang hệ thống */}
        <div className="pt-4 border-t border-white/10 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-[10px] tracking-[0.14em] text-[#A29C90] uppercase">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-[#8E887C]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>CHỈ DÀNH CHO NHÂN SỰ ĐƯỢC CẤP QUYỀN</span>
          </div>
          <p className="text-[11px] text-[#7D786E]">
            Trợ giúp &amp; Hỗ trợ kỹ thuật &nbsp;•&nbsp; v2.4.8-PROD
            &nbsp;•&nbsp; Máy chủ: SG-01 (Hoạt động ổn định)
          </p>
        </div>
      </div>

      {/* Modal xác thực OTP */}
      {showOtpModal && (
        <div className="fixed inset-0 flex items-center justify-center z-30 bg-black/75 backdrop-blur-sm px-4">
          <div className="bg-[#141417] border border-[#D4AF6A]/40 text-[#F3EFE6] p-6 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-3">
              <h2
                className="text-xl font-semibold text-[#F8F5EE]"
                style={serifFont}
              >
                Xác thực tài khoản
              </h2>
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setOtp(["", "", "", "", "", ""]);
                }}
                className="text-[#8E897E] hover:text-white transition-colors"
                aria-label="Đóng cửa sổ"
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
            <p className="text-xs text-[#A6A197] mb-5">
              Chúng tôi đã gửi mã xác thực gồm 6 chữ số tới email của bạn
            </p>
            <div className="flex justify-center gap-2 mb-5">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputs.current[index] = el)}
                  id={`otp-input-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-11 h-12 text-center text-lg rounded-md bg-[#0B0B0C] border border-white/15 text-[#F8F5EE] focus:outline-none focus:border-[#D4AF6A]"
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
                className="w-full py-2.5 px-4 rounded-md border border-[#D4AF6A]/60 bg-[#2C2314] hover:bg-[#3A2E1A] text-[#E8CA8E] text-xs font-semibold tracking-[0.16em] uppercase transition-colors"
              >
                Xác nhận mã OTP
              </button>
            </div>
            <div className="text-center mt-4 text-xs text-[#8E897E]">
              Không nhận được mã?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleResendOtp();
                }}
                className="text-[#D4AF6A] hover:underline"
              >
                Gửi lại mã
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal đặt mật khẩu mới */}
      {showNewPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center z-30 bg-black/75 backdrop-blur-sm px-4">
          <div className="bg-[#141417] border border-[#D4AF6A]/40 text-[#F3EFE6] p-6 rounded-xl shadow-2xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2
                className="text-xl font-semibold text-[#F8F5EE]"
                style={serifFont}
              >
                Đặt mật khẩu mới
              </h2>
              <button
                onClick={() => {
                  setShowNewPasswordModal(false);
                  setNewPassword("");
                  setConfirmPassword("");
                  setNewPasswordError("");
                }}
                className="text-[#8E897E] hover:text-white transition-colors"
                aria-label="Đóng cửa sổ"
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
              <div className="bg-red-950/75 border border-red-500/45 text-red-200 px-3.5 py-2 rounded-md mb-4 text-xs">
                {newPasswordError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[10px] font-medium tracking-[0.15em] text-[#B4AEA2] uppercase mb-1.5">
                MẬT KHẨU MỚI
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#0B0B0C] border border-white/15 text-sm text-[#F3EFE6] placeholder-[#736E65] focus:outline-none focus:border-[#D4AF6A]"
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
              />
            </div>

            <div className="mb-5">
              <label className="block text-[10px] font-medium tracking-[0.15em] text-[#B4AEA2] uppercase mb-1.5">
                XÁC NHẬN MẬT KHẨU
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#0B0B0C] border border-white/15 text-sm text-[#F3EFE6] placeholder-[#736E65] focus:outline-none focus:border-[#D4AF6A]"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleNewPasswordSubmit}
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-md border border-[#D4AF6A]/60 bg-[#2C2314] hover:bg-[#3A2E1A] text-[#E8CA8E] text-xs font-semibold tracking-[0.16em] uppercase transition-colors ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Đang lưu..." : "Lưu mật khẩu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
