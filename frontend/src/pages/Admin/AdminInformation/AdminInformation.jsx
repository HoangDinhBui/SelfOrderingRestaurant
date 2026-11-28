import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuBar from "../../../components/layout/MenuBar";

// Display labels for stored enum-like values (stored values stay in English for the backend)
const WORK_SHIFT_LABEL = { "Full-time": "Toàn thời gian", "Part-time": "Bán thời gian" };
const POSITION_LABEL = { "Service staff": "Nhân viên phục vụ", Manager: "Quản lý", Supervisor: "Giám sát", Chef: "Đầu bếp" };
const label = (map, value) => map[value] || value || "—";

// Shift models data
const shiftModels = {
  "Full-time": {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    hours: "7:00am - 11:00pm"
  },
  "Part-time": {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    hours: "7:00am - 11:00pm"
  }
};

const AdminInformation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const [staffData, setStaffData] = useState({
    fullName: "Trần Thị Mỹ Dung",
    startDate: "01/02/2024",
    workShift: "Full-time",
    position: "Service staff",
    phone: "0987654321",
    address: "448 Lê Văn Việt, TP. Thủ Đức",
    email: "MDXD1234@gmail.com"
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: ""
  });

 // The schedule lives on its own page backed by the real shift data
 const handleScheduleShiftClick = () => {
  navigate("/shift-schedule_admin");
};

  // Modified to match the screenshot - now opens the dropdown menu instead
  const handleAvatarClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleAvatarModal = () => {
    setIsAvatarModalOpen(!isAvatarModalOpen);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStaffData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsEditModalOpen(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setIsPasswordModalOpen(false);
    setPasswordData({ oldPassword: "", newPassword: "" });
  };

  // Get the appropriate shift model based on staff type
  const currentShiftModel = shiftModels[staffData.workShift];

  return (
    <div className="min-h-screen w-full bg-cream flex flex-col relative">
      {/* Overlay when menu is open */}
      {isMenuOpen && (
        <div className="absolute inset-0 bg-black/50 z-10"></div>
      )}

      {/* Overlay when edit modal is open */}
      {isEditModalOpen && (
        <div className="absolute inset-0 bg-black/40 z-40"></div>
      )}

      {/* Overlay when shift modal is open */}
      {isShiftModalOpen && (
        <div className="absolute inset-0 bg-black/40 z-40"></div>
      )}

      {/* Overlay when avatar modal is open */}
      {isAvatarModalOpen && (
        <div className="absolute inset-0 bg-black/40 z-40"></div>
      )}

      {/* Header - full width */}
      <MenuBar title="PROFILE" isProfilePage={true} />

      {/* Avatar Modal - Keeping this code in case you want to still use it elsewhere */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Ảnh đại diện</h2>
              <button 
                onClick={toggleAvatarModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col items-center">
              <img
                src="/img/MyDung.jpg"
                alt="Ảnh đại diện"
                className="w-48 h-48 rounded-full border-2 border-gray-200 mb-4"
              />
              
              <div className="flex space-x-4 mt-4">
                <button className="px-4 py-2 bg-brand text-white rounded hover:bg-brand-hover">
                  Đổi ảnh
                </button>
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  onClick={toggleAvatarModal}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown menu - Styled to match the screenshot */}
      {isMenuOpen && (
        <div className="absolute top-16 right-6 bg-white rounded-lg shadow-lg z-30 w-48">
          <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
            Hồ sơ
          </button>
          <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
            Đăng xuất
          </button>
        </div>
      )}

      {/* Edit Staff Information Modal */}
      {isEditModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"></div>
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 z-50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <button 
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-bold mx-auto">Thông tin nhân viên</h2>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <table className="w-full border-collapse mb-8">
                    <tbody>
                      <tr className="border border-gray-300">
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center w-1/3">Họ và tên</td>
                        <td className="py-3 px-6">
                          <input
                            type="text"
                            name="fullName"
                            value={staffData.fullName}
                            onChange={handleInputChange}
                            className="w-full border-none outline-none bg-transparent"
                            placeholder="Nhập họ và tên"
                          />
                        </td>
                      </tr>
                      
                      <tr className="border border-gray-300">
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">Ngày bắt đầu làm việc</td>
                        <td className="py-3 px-6">
                          <input
                            type="text"
                            name="startDate"
                            value={staffData.startDate}
                            onChange={handleInputChange}
                            className="w-full border-none outline-none bg-transparent"
                            placeholder="DD/MM/YYYY"
                          />
                        </td>
                      </tr>
                      
                      <tr className="border border-gray-300">
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">Ca làm việc</td>
                        <td className="py-3 px-6">
                          <select
                            name="workShift"
                            value={staffData.workShift}
                            onChange={handleInputChange}
                            className="w-full border-none outline-none bg-transparent"
                          >
                            <option value="Full-time">Toàn thời gian</option>
                            <option value="Part-time">Bán thời gian</option>
                          </select>
                        </td>
                      </tr>
                      
                      <tr className="border border-gray-300">
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">Chức vụ</td>
                        <td className="py-3 px-6">
                          <select
                            name="position"
                            value={staffData.position}
                            onChange={handleInputChange}
                            className="w-full border-none outline-none bg-transparent"
                          >
                            <option value="Service staff">Nhân viên phục vụ</option>
                            <option value="Manager">Quản lý</option>
                            <option value="Supervisor">Giám sát</option>
                          </select>
                        </td>
                      </tr>
                      
                      <tr className="border border-gray-300">
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">Số điện thoại</td>
                        <td className="py-3 px-6">
                          <div className="flex items-center">
                            <span className="mr-2">+84</span>
                            <input
                              type="text"
                              name="phone"
                              value={staffData.phone}
                              onChange={handleInputChange}
                              className="flex-1 border-none outline-none bg-transparent"
                              placeholder="Nhập số điện thoại"
                            />
                          </div>
                        </td>
                      </tr>
                      
                      <tr className="border border-gray-300">
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">Địa chỉ</td>
                        <td className="py-3 px-6">
                          <input
                            type="text"
                            name="address"
                            value={staffData.address}
                            onChange={handleInputChange}
                            className="w-full border-none outline-none bg-transparent"
                            placeholder="Nhập địa chỉ"
                          />
                        </td>
                      </tr>
                      
                      <tr className="border border-gray-300">
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">Email</td>
                        <td className="py-3 px-6">
                          <input
                            type="email"
                            name="email"
                            value={staffData.email}
                            onChange={handleInputChange}
                            className="w-full border-none outline-none bg-transparent"
                            placeholder="Nhập email"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-8 py-3 !bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-md"
                    >
                      Lưu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40">
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <button 
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-bold mx-auto">Đổi mật khẩu</h2>
                </div>
                
                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu cũ</label>
                      <input
                        type="password"
                        name="oldPassword"
                        value={passwordData.oldPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        placeholder="Nhập mật khẩu cũ"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        placeholder="Nhập mật khẩu mới"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="px-8 py-3 !bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-md"
                    >
                      Lưu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shift Information Modal */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40">
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <button 
                    onClick={() => setIsShiftModalOpen(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-bold mx-auto">Thông tin ca làm</h2>
                </div>
                
                <div className="mb-4">
                  <p className="font-medium text-center mb-2">Nhân viên: {label(WORK_SHIFT_LABEL, staffData.workShift)}</p>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="font-medium mb-2">Ca:</p>
                    <ul className="space-y-2">
                      {currentShiftModel.days.map((day) => (
                        <li key={day} className="flex justify-between">
                          <span>{day}:</span>
                          <span>{currentShiftModel.hours}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setIsShiftModalOpen(false)}
                    className="px-8 py-3 !bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-md"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Schedule Shift Modal */}
        {isScheduleModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40">
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-50 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <button 
                      onClick={() => setIsScheduleModalOpen(false)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className="text-2xl font-bold mx-auto">Xếp ca làm</h2>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-bold text-lg mb-2">Nhân viên: {label(WORK_SHIFT_LABEL, staffData.workShift)}</h3>
                    <h4 className="font-medium mb-2">Ca:</h4>
                    
                    {staffData.workShift === "Full-time" ? (
                      <ul className="space-y-2">
                        <li>Thứ Hai: Ca 1 (7h–12h)</li>
                        <li>Thứ Ba: Ca 1 (7h–12h)</li>
                        <li>Thứ Tư: Ca 2 (12h–17h)</li>
                        <li>Thứ Năm: Ca 2 (12h–17h)</li>
                        <li>Thứ Sáu: Ca 3 (17h–22h)</li>
                        <li>Thứ Bảy: Ca 3 (17h–22h)</li>
                      </ul>
                    ) : (
                      <ul className="space-y-2">
                        <li>Thứ Hai: Ca 1 (7h–12h)</li>
                        <li>Thứ Ba: Ca 1 (7h–12h)</li>
                        <li>Thứ Tư: Ca 1 (7h–12h)</li>
                        <li>Thứ Năm: Ca 1 (7h–12h)</li>
                        <li>Thứ Sáu: Nghỉ</li>
                        <li>Thứ Bảy: Nghỉ</li>
                      </ul>
                    )}
                  </div>
                  
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setIsScheduleModalOpen(false)}
                      className="px-8 py-3 !bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-md"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Main Content */}
      <div className="flex-1 bg-cream p-8 relative z-20">
        <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-lg">
          {/* Top image banner */}
          <div
            className="w-full h-50 bg-cover bg-center relative"
            style={{
              backgroundImage: "url('/img/StaffInforBG.jpg')",
            }}
          >
            {/* Name and position overlay on the image */}
            <div className="absolute bottom-0 left-64 text-white pb-1">
              <h2 className="text-lg font-bold">Trần Thị Mỹ Dung</h2>
              <p className="text-sm">Chức vụ: Nhân viên</p>
            </div>
          </div>

          {/* Content area with white background */}
          <div className="bg-cream p-8 relative">
            {/* Profile avatar positioned on the left, overlapping the banner */}
            <div className="absolute -top-16 left-24">
              <div className="p-1 bg-white rounded-full shadow-lg">
                <img
                  src="/img/MyDung.jpg"
                  alt="Ảnh nhân viên"
                  className="w-32 h-32 rounded-full border-2 border-white"
                />
              </div>
            </div>

            {/* Main content containers */}
            <div className="w-full flex pt-20 gap-6">
              {/* Left column */}
              <div className="w-1/3 flex flex-col gap-4">
                {/* First panel */}
                <div className="bg-brand-soft rounded-lg border border-gray-200 p-2">
                  <button 
                    className="w-full text-left flex items-center px-4 py-2 text-brand hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Sửa thông tin nhân viên
                  </button>
                  <div className="w-full flex justify-between items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                        />
                      </svg>
                      Ngôn ngữ
                    </div>
                    <span className="text-brand">Tiếng Anh</span>
                  </div>
                </div>

                {/* Second panel */}
                <div className="bg-brand-soft rounded-lg border border-gray-200 p-2">
                  <button 
                    className="w-full text-left flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => navigate("/shift-schedule_admin")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Xem ca làm
                  </button>
                  <button 
                    className="w-full text-left flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={handleScheduleShiftClick}
                  >
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                    Xếp ca làm
                  </button>
                  <button 
                    className="w-full text-left flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsPasswordModalOpen(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    Đổi tên đăng nhập & mật khẩu
                  </button>
                  <button className="w-full text-left flex items-center px-4 py-2 text-red-500 hover:bg-gray-100 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              </div>

              {/* Right column */}
              <div className="w-2/3">
                <div className="bg-brand-soft p-6 rounded-lg">
                  <div className="grid grid-cols-1 gap-3">
                    <p className="text-sm">
                      <strong>Họ và tên:</strong> {staffData.fullName}
                    </p>
                    <p className="text-sm">
                      <strong>Mã nhân viên:</strong> 1
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> {staffData.email}
                    </p>
                    <p className="text-sm">
                      <strong>Chức vụ:</strong> {label(POSITION_LABEL, staffData.position)}
                    </p>
                    <p className="text-sm">
                      <strong>{label(WORK_SHIFT_LABEL, staffData.workShift)} | </strong> +84 {staffData.phone}
                    </p>
                    <p className="text-sm">
                      <strong>Lương:</strong> 9.500.000đ
                    </p>
                    <p className="text-sm">
                      <strong>Địa chỉ:</strong> {staffData.address}
                    </p>
                    <p className="text-sm">
                      <strong>Ca làm việc:</strong>
                    </p>
                    <p className="text-sm text-center">
                      Ca 01: 7:00 - 13:00
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInformation;
