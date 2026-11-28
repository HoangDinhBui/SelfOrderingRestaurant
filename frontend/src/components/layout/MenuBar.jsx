import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useStaffLogout from "../attendance/useStaffLogout";

// --- SVG Icons trực quan cho từng mục lục ---
const TableIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path strokeLinecap="round" d="M7 20v-4m10 4v-4M3 10h18" />
  </svg>
);

const MenuBookIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);

const DishIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4.5" strokeDasharray="2 2" />
    <path strokeLinecap="round" d="M12 3v2m0 14v2M3 12h2m14 0h2" />
  </svg>
);

const OrderIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h4m-4 4h4m-6-4h.01M9 16h.01"
    />
  </svg>
);

const InventoryIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const RevenueIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const StaffIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const ScheduleIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ClockIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
  </svg>
);

const EvaluateIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);

const BellIcon = () => (
  <svg
    className="w-4 h-4 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const MenuBar = ({ title = "Quản lý sơ đồ bàn" }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { requestLogout, logoutModal } = useStaffLogout();

  // Phân quyền: Lấy userType từ localStorage, mặc định là ADMIN
  const rawUserType = (
    localStorage.getItem("userType") || "ADMIN"
  ).toUpperCase();
  const isAdmin = rawUserType === "ADMIN";
  const isStaff = rawUserType === "STAFF";

  const fullname =
    localStorage.getItem("fullname") ||
    localStorage.getItem("username") ||
    (isAdmin ? "Quản trị viên" : "Nhân viên phục vụ");
  const username = localStorage.getItem("username") || "user";

  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const mobileNavRef = useRef(null);

  // Cập nhật đồng hồ thời gian thực
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (
        mobileNavRef.current &&
        !mobileNavRef.current.contains(event.target)
      ) {
        setIsMobileNavOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- PHÂN QUYỀN CHỨC NĂNG RÕ RÀNG ---
  // 1. ADMIN: Đầy đủ tất cả các tính năng quản trị & vận hành
  const adminLinks = [
    { label: "Sơ đồ bàn", path: "/table-management_admin", icon: TableIcon },
    { label: "Thực đơn", path: "/menu-management_admin", icon: MenuBookIcon },
    { label: "Món ăn", path: "/dish-management_admin", icon: DishIcon },
    {
      label: "Lịch sử đơn hàng",
      path: "/order-history_admin",
      icon: OrderIcon,
    },
    {
      label: "Kho nguyên liệu",
      path: "/inventory-management_admin",
      icon: InventoryIcon,
    },
    {
      label: "Doanh thu",
      path: "/revenue-management_admin",
      icon: RevenueIcon,
    },
    { label: "Nhân viên", path: "/staff-management_admin", icon: StaffIcon },
    { label: "Lịch ca làm", path: "/shift-schedule_admin", icon: ScheduleIcon },
    { label: "Đánh giá", path: "/evaluate_admin", icon: EvaluateIcon },
  ];

  // 2. STAFF: Quyền phục vụ đầy đủ, có Lịch sử đơn hàng & Đánh giá, bỏ Chấm công
  const staffLinks = [
    { label: "Sơ đồ bàn", path: "/table-management_staff", icon: TableIcon },
    { label: "Món ăn", path: "/dish-management_staff", icon: DishIcon },
    { label: "Lịch sử đơn hàng", path: "/order-history", icon: OrderIcon },
    { label: "Đánh giá", path: "/evaluate_admin", icon: EvaluateIcon },
    { label: "Thông báo", path: "/notification-management", icon: BellIcon },
  ];

  // Chọn danh sách link theo Role
  const activeNavLinks = isAdmin ? adminLinks : staffLinks;

  // Trang chủ mặc định khi click Logo
  const homePath = isAdmin
    ? "/table-management_admin"
    : "/table-management_staff";
  const profilePath = isAdmin
    ? "/admin-information_admin"
    : "/staff-information_staff";

  // Số link hiển thị trực tiếp trên thanh menu trước khi vào dropdown "Thêm"
  const visibleCount = isAdmin ? 5 : 6;
  const primaryLinks = activeNavLinks.slice(0, visibleCount);
  const extraLinks = activeNavLinks.slice(visibleCount);

  return (
    <>
      <header className="w-full bg-white border-b border-[#EFE1D1] shadow-xs px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4 sticky top-0 z-40 select-none">
        {/* --- CỤM TRÁI: LOGO + ROLE BADGE + NAVIGATION BUTTONS --- */}
        <div className="flex items-center gap-3 xl:gap-5 min-w-0">
          {/* Logo Brand */}
          <div
            onClick={() => navigate(homePath)}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            title="Về trang chủ"
          >
            <div className="flex flex-col">
              <span className="font-serif italic font-bold text-lg text-[#33261D] leading-tight tracking-tight group-hover:text-[#EA580C] transition-colors">
                Bon Appétit
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {/* Huy hiệu phân rõ quyền Staff và Admin */}
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                    Quản trị viên
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    Nhân viên
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-[#EFE1D1] hidden lg:block shrink-0" />

          {/* --- CÁC NÚT ĐIỀU HƯỚNG (CÁCH NHAU RÕ RÀNG, HOVER ĐỔI MÀU NỔI BẬT) --- */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-2.5">
            {primaryLinks.map((item) => {
              const isActive = location.pathname === item.path;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`group inline-flex items-center justify-center !gap-2.5 !px-3 !py-2 !rounded-xl text-xs xl:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-2xs ${
                    isActive
                      ? "bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white border border-[#C2410C] shadow-sm shadow-[#EA580C]/25 ring-2 ring-[#FED7AA]/70 scale-[1.02]"
                      : "bg-[#FAF7F2] text-[#4A3B30] border border-[#EBD9C8] hover:bg-[#EA580C] hover:text-white hover:border-[#C2410C] hover:shadow-md hover:shadow-[#EA580C]/20 hover:-translate-y-0.5 active:scale-98"
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center transition-colors duration-200 ${
                      isActive
                        ? "text-white"
                        : "text-[#C2410C] group-hover:text-white"
                    }`}
                  >
                    <IconComponent />
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Menu mở rộng (Thêm mục lục cho Admin khi có nhiều chức năng) */}
            {extraLinks.length > 0 &&
              (() => {
                const activeExtraLink = extraLinks.find(
                  (l) => location.pathname === l.path,
                );
                const ActiveIcon = activeExtraLink?.icon;
                const isHighlighted = isMenuOpen || Boolean(activeExtraLink);

                return (
                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className={`group inline-flex items-center justify-center !gap-2 !px-4 !py-2.5 !rounded-xl text-xs xl:text-sm font-semibold border transition-all duration-200 cursor-pointer shadow-2xs ${
                        isHighlighted
                          ? "bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white border-[#C2410C] shadow-sm shadow-[#EA580C]/25 ring-2 ring-[#FED7AA]/70 scale-[1.02]"
                          : "bg-[#FAF7F2] text-[#4A3B30] border-[#EBD9C8] hover:bg-[#EA580C] hover:text-white hover:border-[#C2410C] hover:shadow-md hover:shadow-[#EA580C]/20 hover:-translate-y-0.5 active:scale-98"
                      }`}
                    >
                      {ActiveIcon && (
                        <span className="inline-flex items-center justify-center shrink-0 text-white">
                          <ActiveIcon />
                        </span>
                      )}
                      <span>
                        {activeExtraLink ? activeExtraLink.label : "Thêm"}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                          isMenuOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isMenuOpen && (
                      <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#F2E0CE] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-3.5 py-1.5 mb-1.5 text-[11px] font-bold text-[#A89380] uppercase tracking-wider border-b border-[#F7EFE7]">
                          Chức năng khác
                        </div>

                        {/* Bọc danh sách item bằng flex-col + gap để tạo khoảng cách giữa các mục */}
                        <div className="flex flex-col gap-1 px-1.5">
                          {extraLinks.map((item) => {
                            const isActive = location.pathname === item.path;
                            const IconComponent = item.icon;
                            return (
                              <button
                                key={item.path}
                                type="button"
                                onClick={() => {
                                  navigate(item.path);
                                  setIsMenuOpen(false);
                                }}
                                className={`w-full text-left !px-3 !py-2.5 !rounded-xl text-xs xl:text-sm font-semibold flex items-center !gap-2.5 transition-all duration-150 cursor-pointer ${
                                  isActive
                                    ? "bg-[#FFF0E2] text-[#C2410C] font-bold border-l-4 border-[#EA580C]"
                                    : "text-[#4A3B30] hover:bg-[#EA580C] hover:text-white"
                                }`}
                              >
                                <span
                                  className={isActive ? "text-[#C2410C]" : ""}
                                >
                                  <IconComponent />
                                </span>
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
          </nav>
        </div>

        {/* --- CỤM PHẢI: TRẠNG THÁI + ĐỒNG HỒ + HỒ SƠ CÁ NHÂN --- */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Nút Hamburger cho Mobile/Tablet nhỏ */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#FAF7F2] text-[#5C4A3C] border border-[#EBD9C8] hover:bg-[#EA580C] hover:text-white transition-all"
            title="Mở menu điều hướng"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Trạng thái hoạt động & Đồng hồ */}
          <div className="hidden md:flex items-center gap-2 text-xs text-[#7A6957]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              Trực tuyến
            </span>
            <span className="font-mono text-xs text-[#524436] font-bold bg-[#FAF6F0] px-2.5 py-1 rounded-xl border border-[#EBD9C8] shadow-2xs">
              {currentTime}
            </span>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 sm:gap-2.5 !p-1.5 sm:!pr-3 !rounded-2xl bg-[#FAF7F2] hover:bg-[#FFF3E6] border border-[#EBD9C8] hover:border-[#EA580C] transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <img
                src="/img/MyDung.jpg"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80";
                }}
                alt="Ảnh đại diện"
                className="w-8 h-8 rounded-xl object-cover border border-[#E8D4BE]"
              />
              <div className="text-left hidden sm:block leading-tight">
                <p className="text-xs font-bold text-[#33261D] max-w-[110px] truncate">
                  {fullname}
                </p>
                <p className="text-[10px] text-[#A38F7D] font-semibold">
                  {isAdmin ? "Quản lý sảnh" : "Nhân viên ca"}
                </p>
              </div>
              <svg
                className={`w-3.5 h-3.5 text-[#9C8A79] transition-transform duration-200 hidden sm:block ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#F2E0CE] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Thông tin tài khoản */}
                <div className="px-4 py-2 mb-1 border-b border-[#F7EFE7]">
                  <p className="text-xs font-bold text-[#33261D] truncate">
                    {fullname}
                  </p>
                  <p className="text-[11px] text-[#8C7A6B] mt-0.5 flex items-center gap-1.5">
                    <span>Quyền:</span>
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        isAdmin
                          ? "bg-[#FEF3C7] text-[#B45309]"
                          : "bg-[#DCFCE7] text-[#15803D]"
                      }`}
                    >
                      {isAdmin ? "ADMIN" : "STAFF"}
                    </span>
                  </p>
                </div>

                {/* Các thao tác cá nhân */}
                <div className="flex flex-col gap-1 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(profilePath);
                    }}
                    className="w-full text-left !px-3 !py-2.5 !rounded-xl text-xs xl:text-sm font-semibold text-[#4A3B30] hover:bg-[#EA580C] hover:text-white flex items-center !gap-2.5 transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>Thông tin cá nhân</span>
                  </button>
                </div>

                {/* Đăng xuất */}
                <div className="border-t border-[#F7EFE7] mt-1 pt-1.5 px-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      requestLogout();
                    }}
                    className="w-full text-left !px-3 !py-2.5 !rounded-xl text-xs xl:text-sm text-[#DC2626] hover:bg-[#FEF2F2] flex items-center !gap-2.5 font-bold transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- MENU MOBILE / TABLET DRAWER --- */}
      {isMobileNavOpen && (
        <div
          ref={mobileNavRef}
          className="lg:hidden w-full bg-white border-b border-[#EFE1D1] px-4 py-3 shadow-md z-30 animate-in fade-in slide-in-from-top-1"
        >
          <div className="grid grid-cols-2 gap-2">
            {activeNavLinks.map((item) => {
              const isActive = location.pathname === item.path;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileNavOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    isActive
                      ? "bg-[#EA580C] text-white border-[#C2410C] shadow-sm"
                      : "bg-[#FAF7F2] text-[#4A3B30] border-[#EBD9C8] hover:bg-[#EA580C] hover:text-white"
                  }`}
                >
                  <IconComponent />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {logoutModal}
    </>
  );
};

export default MenuBar;
