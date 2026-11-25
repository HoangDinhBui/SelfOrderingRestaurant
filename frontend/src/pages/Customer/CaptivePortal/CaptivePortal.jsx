import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUtensils, FaQrcode, FaCamera, FaTimes, FaArrowRight } from "react-icons/fa";
import welcomeBg from "../../../assets/img/welcome_bg.jpg";

const CaptivePortal = () => {
  const navigate = useNavigate();
  const [showQrModal, setShowQrModal] = useState(false);
  const [manualTable, setManualTable] = useState("1");
  const [isScanning, setIsScanning] = useState(false);

  const handleQuickGoTable = (num) => {
    const tableNumber = num || manualTable || "1";
    localStorage.setItem("tableNumber", tableNumber);
    navigate(`/table/${tableNumber}`);
  };

  const handleStartScan = () => {
    setIsScanning(true);
    // Giả lập quét camera nhận diện sau 1.5s hoặc cho phép chọn bàn
    setTimeout(() => {
      setIsScanning(false);
      handleQuickGoTable(manualTable || "1");
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden select-none font-sans">
      {/* Background Image with Dark Vignette Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={welcomeBg}
          alt="Restaurant background"
          className="w-full h-full object-cover object-center filter brightness-75 scale-105"
        />
        {/* Gradients to match the exact dark luxury mood */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/90" />
      </div>

      {/* Main Content Card (Mobile-first layout) */}
      <div className="relative z-10 w-full max-w-[420px] min-h-screen sm:min-h-[90vh] flex flex-col justify-between px-6 py-10 sm:py-12 mx-auto text-white">
        {/* Top: Header & Logo */}
        <div className="flex flex-col items-center text-center mt-2">
          <span className="text-[11px] sm:text-[12px] font-medium tracking-[0.28em] text-gray-300 uppercase mb-3">
            CHÀO MỪNG ĐẾN VỚI
          </span>

          {/* Logo Brand */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-gray-200 text-lg mb-0.5">
              <FaUtensils className="text-sm opacity-90" />
            </div>
            <h1
              className="text-3xl sm:text-4xl font-serif italic tracking-wide text-white"
              style={{ fontFamily: "'Playfair Display', 'Times New Roman', serif" }}
            >
              Bon Appétit
            </h1>
            <div className="w-12 h-[2px] bg-[#C2410C] mt-1.5 rounded-full" />
          </div>
        </div>

        {/* Middle: Headline & Tagline */}
        <div className="my-auto py-6 text-center flex flex-col items-center">
          <h2 className="text-[26px] sm:text-[30px] font-bold leading-tight text-white tracking-tight drop-shadow-md">
            Thưởng thức hương vị <br />
            ấm áp từ trái tim.
          </h2>
          <p className="mt-3 text-xs sm:text-[13px] text-gray-300/90 leading-relaxed max-w-[280px]">
            Trải nghiệm ẩm thực tinh tế trong không gian sang trọng và gần gũi nhất.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-3.5 w-full pb-2">
          {/* Main Action: Quét mã QR ngay! */}
          <button
            onClick={() => setShowQrModal(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#B83818] hover:bg-[#a63013] active:scale-[0.98] text-white font-semibold text-base shadow-lg shadow-[#B83818]/40 transition-all flex items-center justify-center gap-2"
          >
            <FaQrcode className="text-lg" />
            <span>Quét mã QR ngay!</span>
          </button>

          {/* Secondary Action: Đăng ký */}
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white font-medium text-base backdrop-blur-md border border-white/10 transition-all"
          >
            Đăng ký
          </button>

          {/* Divider */}
          <div className="flex items-center my-2 gap-3">
            <div className="flex-1 h-[1px] bg-white/15" />
            <span className="text-[10px] tracking-widest text-gray-400 uppercase font-medium">
              HOẶC KẾT NỐI QUA
            </span>
            <div className="flex-1 h-[1px] bg-white/15" />
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate("/login")}
              className="py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white text-sm font-medium backdrop-blur-md border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              onClick={() => navigate("/login")}
              className="py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white text-sm font-medium backdrop-blur-md border border-white/10 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          {/* Login prompt */}
          <div className="text-center text-xs text-gray-400 mt-2">
            Đã có tài khoản?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-white font-semibold hover:underline ml-1"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </div>

      {/* Quick QR Scanner & Table Selector Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#1A1A1A] border border-white/15 p-6 text-white shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition"
            >
              <FaTimes />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#B83818]/20 text-[#B83818] flex items-center justify-center text-xl mb-3">
                <FaQrcode />
              </div>
              <h3 className="text-lg font-bold">Vào bàn gọi món</h3>
              <p className="text-xs text-gray-400 mt-1">
                Quét mã tại bàn hoặc chọn nhanh số bàn để trải nghiệm
              </p>
            </div>

            {/* Fast Table Selection for testing */}
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  Chọn nhanh số bàn mẫu:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 5, 8].map((t) => (
                    <button
                      key={t}
                      onClick={() => handleQuickGoTable(t)}
                      className={`py-2 rounded-xl text-sm font-semibold border transition ${
                        manualTable === String(t)
                          ? "bg-[#B83818] border-[#B83818] text-white shadow-md"
                          : "bg-white/5 border-white/10 text-gray-200 hover:bg-white/10"
                      }`}
                    >
                      Bàn {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">
                  Hoặc nhập số bàn bất kỳ:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={manualTable}
                    onChange={(e) => setManualTable(e.target.value)}
                    placeholder="VD: 1, 2, 10..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#B83818]"
                  />
                  <button
                    onClick={() => handleQuickGoTable(manualTable)}
                    className="px-4 py-2.5 rounded-xl bg-[#B83818] hover:bg-[#a63013] text-white font-medium flex items-center gap-1 transition"
                  >
                    <span>Vào</span>
                    <FaArrowRight className="text-xs" />
                  </button>
                </div>
              </div>

              {/* Camera Scanner Simulation */}
              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-gray-300 font-medium flex items-center justify-center gap-2 border border-white/10 transition"
                >
                  <FaCamera />
                  <span>
                    {isScanning
                      ? "Đang quét mã QR từ Camera..."
                      : "Quét trực tiếp qua Camera"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptivePortal;
