// StaffInformation.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useStaffLogout from "../../../components/attendance/useStaffLogout";
import MenuBar from "../../../components/layout/MenuBar";

import { BACKEND_URL } from "../../../config";

// Display labels for stored enum-like values (stored values stay in English for the backend)
const WORK_SHIFT_LABEL = { "Full-time": "Toàn thời gian", "Part-time": "Bán thời gian" };
const POSITION_LABEL = { "Service staff": "Nhân viên phục vụ", Manager: "Quản lý", Supervisor: "Giám sát", Chef: "Đầu bếp" };
const label = (map, value) => map[value] || value || "—";
const shiftModels = {
  "Full-time": {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    hours: "7:00am - 11:00pm",
  },
  "Part-time": {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday"],
    hours: "7:00am - 11:00pm",
  },
};

const hhmm = (time) => (time || "").slice(0, 5);

const dayToDate = (day) => {
  const today = new Date();
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const targetDayIndex = daysOfWeek.indexOf(day);
  const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const diff = targetDayIndex - currentDayIndex;
  today.setDate(today.getDate() + diff);
  // Local calendar date: toISOString() is UTC and gives yesterday before 7am in Vietnam
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const StaffInformation = () => {
  const { requestLogout, logoutModal } = useStaffLogout();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [staffData, setStaffData] = useState({
    staff_id: "",
    fullname: "",
    startDate: "",
    workShift: "Full-time",
    position: "",
    phone: "",
    email: "",
    salary: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  // Shifts come from the admin's shift list; their ids are not fixed
  const [shiftOptions, setShiftOptions] = useState([]);
  const [shiftForm, setShiftForm] = useState({
    day: shiftModels["Full-time"].days[0],
    shiftId: "",
  });

  const [schedule, setSchedule] = useState({});

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/refresh-token`,
        { refreshToken }
      );
      const newAccessToken = response.data.accessToken;
      localStorage.setItem("accessToken", newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error("Refresh token failed:", error);
      toast.warn("Phiên đăng nhập có thể đã hết hạn. Vui lòng đăng nhập lại.");
      return null;
    }
  };

  const fetchStaffInfo = async () => {
    setLoading(true);
    let accessToken = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");
    if (!accessToken || !username) {
      toast.warn("Vui lòng đăng nhập để xem hồ sơ");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching staff info for username:", username);
      const response = await axios.get(
        `${BACKEND_URL}/api/staff/by-username/${username}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const data = response.data;
      setStaffData({
        staff_id: data.staff_id,
        fullname: data.fullname,
        startDate: data.hireDate || "01/02/2024",
        workShift: data.workShift || "Full-time",
        position: data.position,
        phone: data.phone,
        email: data.email,
        salary: data.salary,
      });
    } catch (error) {
      console.error("Fetch staff info error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.response?.config?.url,
      });
      if (error.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          try {
            const retryResponse = await axios.get(
              `${BACKEND_URL}/api/staff/by-username/${username}`,
              {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );
            const data = retryResponse.data;
            setStaffData({
              staff_id: data.staff_id,
              fullname: data.fullname,
              startDate: data.hireDate || "01/02/2024",
              workShift: data.workShift || "Full-time",
              position: data.position,
              phone: data.phone,
              email: data.email,
              salary: data.salary,
            });
          } catch (retryError) {
            console.error("Retry fetch staff info failed:", retryError);
            toast.error("Không tải được thông tin nhân viên");
          }
        }
      } else if (error.response?.status === 403) {
        toast.warn(
          "Không có quyền truy cập. Vui lòng liên hệ quản trị viên"
        );
      } else {
        toast.error(
          error.response?.data?.message || "Không tải được thông tin nhân viên"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    setLoading(true);
    let accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.warn("Vui lòng đăng nhập để xem lịch làm");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching schedule");
      const response = await axios.get(
        `${BACKEND_URL}/api/staff/shifts/my-schedule`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setSchedule(response.data);
    } catch (error) {
      console.error("Fetch schedule error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.response?.config?.url,
      });
      if (error.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          try {
            const retryResponse = await axios.get(
              `${BACKEND_URL}/api/staff/shifts/my-schedule`,
              {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );
            setSchedule(retryResponse.data);
          } catch (retryError) {
            console.error("Retry fetch schedule failed:", retryError);
            toast.error("Không tải được lịch làm việc");
          }
        }
      } else if (error.response?.status === 403) {
        toast.warn(
          "Không có quyền truy cập. Vui lòng liên hệ quản trị viên"
        );
      } else {
        toast.error(error.response?.data?.message || "Không tải được lịch làm việc");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchShiftOptions = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/staff/shifts/available`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      const shifts = [...(response.data || [])].sort((a, b) =>
        (a.startTime || "").localeCompare(b.startTime || "")
      );
      setShiftOptions(shifts);
      setShiftForm((prev) => ({ ...prev, shiftId: prev.shiftId || shifts[0]?.shiftId || "" }));
    } catch (error) {
      console.error("Error fetching shifts:", error.response?.status);
    }
  };

  useEffect(() => {
    // Never log tokens: the console is readable by anyone at the device
    console.log("StaffInformation: Component mounted");
    fetchShiftOptions();
    fetchStaffInfo();
    fetchSchedule();
  }, []);

  const handleLogout = () => {
    requestLogout();
  };

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    console.log("Avatar clicked, toggling isMenuOpen to:", !isMenuOpen);
    setIsMenuOpen((prev) => !prev);
  };

  const toggleAvatarModal = (e) => {
    e.stopPropagation();
    console.log("Avatar modal toggled, isAvatarModalOpen:", !isAvatarModalOpen);
    setIsAvatarModalOpen((prev) => !prev);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStaffData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShiftFormChange = (e) => {
    const { name, value } = e.target;
    setShiftForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsEditModalOpen(false);
    toast.success("Đã lưu thông tin nhân viên!");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setIsPasswordModalOpen(false);
    setPasswordData({ oldPassword: "", newPassword: "" });
    toast.success("Đã đổi mật khẩu!");
  };

  const handleShiftSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Vui lòng đăng nhập để đăng ký ca");
      setLoading(false);
      return;
    }

    const shiftRegistration = {
      shiftId: Number(shiftForm.shiftId),
      date: dayToDate(shiftForm.day),
    };

    try {
      await axios.post(
        `${BACKEND_URL}/api/staff/shifts/register`,
        shiftRegistration,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      toast.success("Đăng ký ca thành công!");
      fetchSchedule();
      setShiftForm({
        day: shiftModels[staffData.workShift].days[0],
        shiftId: shiftOptions[0]?.shiftId ?? "",
      });
      setIsScheduleModalOpen(false);
    } catch (error) {
      console.error("Shift registration error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
      });
      if (error.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          try {
            await axios.post(
              `${BACKEND_URL}/api/staff/shifts/register`,
              shiftRegistration,
              {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );
            toast.success("Đăng ký ca thành công!");
            fetchSchedule();
            setShiftForm({
              day: shiftModels[staffData.workShift].days[0],
              shiftId: shiftOptions[0]?.shiftId ?? "",
            });
            setIsScheduleModalOpen(false);
          } catch (retryError) {
            console.error("Retry shift registration failed:", retryError);
            toast.error("Không đăng ký được ca");
          }
        }
      } else if (error.response?.status === 403) {
        toast.warn(
          "Không có quyền truy cập. Vui lòng liên hệ quản trị viên"
        );
      } else {
        toast.error(
          error.response?.data?.message || "Không đăng ký được ca"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelShift = async (staffShiftId) => {
    setLoading(true);
    let accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Vui lòng đăng nhập để hủy ca");
      setLoading(false);
      return;
    }

    try {
      await axios.delete(
        `${BACKEND_URL}/api/staff/shifts/${staffShiftId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      toast.success("Đã hủy ca!");
      fetchSchedule();
    } catch (error) {
      console.error("Shift cancellation error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
      });
      if (error.response?.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          try {
            await axios.delete(
              `${BACKEND_URL}/api/staff/shifts/${staffShiftId}`,
              {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                },
              }
            );
            toast.success("Đã hủy ca!");
            fetchSchedule();
          } catch (retryError) {
            console.error("Retry shift cancellation failed:", retryError);
            toast.error("Không hủy được ca");
          }
        }
      } else if (error.response?.status === 403) {
        toast.warn(
          "Không có quyền truy cập. Vui lòng liên hệ quản trị viên"
        );
      } else {
        toast.error(error.response?.data?.message || "Không hủy được ca");
      }
    } finally {
      setLoading(false);
    }
  };

  const currentShiftModel = shiftModels[staffData.workShift];

  // Add render error boundary
  try {
    console.log(
      "StaffInformation: Rendering component, isMenuOpen:",
      isMenuOpen
    );
    return (
      <div className="min-h-screen w-full bg-cream flex flex-col relative">
        <ToastContainer position="top-right" autoClose={3000} />
        <MenuBar
          title="Hồ sơ"
          icon="https://img.icons8.com/?size=100&id=34105&format=png&color=FFFFFF"
        />
        {isAvatarModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Ảnh đại diện</h2>
                <button
                  onClick={toggleAvatarModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col items-center">
                <img
                  src="/img/MyDung.jpg"
                  alt="Ảnh đại diện"
                  className="w-48 h-48 rounded-full border-2 border-gray-200 mb-4 object-cover"
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
        {isMenuOpen && (
          <div className="absolute mt-5 top-12 right-[15px] bg-white rounded-lg shadow-lg z-30 w-48 border border-gray-200">
            <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
              Hồ sơ
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
              onClick={() => {
                console.log("Dropdown Logout button: onClick triggered");
                handleLogout();
              }}
            >
              Đăng xuất
            </button>
          </div>
        )}
        {isEditModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 z-50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-bold mx-auto">
                    Thông tin nhân viên
                  </h2>
                </div>
                <form onSubmit={handleSubmit}>
                  <table className="w-full border-collapse mb-8">
                    <tbody>
                      <tr className="border border-gray-300">
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center w-1/3">
                          Họ và tên
                        </td>
                        <td className="py-3 px-6">
                          <input
                            type="text"
                            name="fullName"
                            value={staffData.fullname}
                            onChange={handleInputChange}
                            className="w-full border-none outline-none bg-transparent"
                            placeholder="Nhập họ và tên"
                          />
                        </td>
                      </tr>
                      <tr className="border border-gray-300">
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">
                          Ngày bắt đầu làm việc
                        </td>
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
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">
                          Ca làm việc
                        </td>
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
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">
                          Số điện thoại
                        </td>
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
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">
                          Địa chỉ
                        </td>
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
                        <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">
                          Email
                        </td>
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
                      className="px-8 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-md"
                      style={{ backgroundColor: "#C2410C" }}
                    >
                      Lưu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-bold mx-auto">
                    Đổi mật khẩu
                  </h2>
                </div>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mật khẩu cũ
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mật khẩu mới
                      </label>
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
                      className="px-8 py-3 text-white rounded-lg transition-colors shadow-md"
                      style={{ backgroundColor: "#C2410C" }}
                    >
                      Lưu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {isShiftModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setIsShiftModalOpen(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-bold mx-auto">
                    Thông tin ca làm
                  </h2>
                </div>
                <div className="mb-4">
                  <p className="font-medium text-center mb-2">
                    Nhân viên: {label(WORK_SHIFT_LABEL, staffData.workShift)}
                  </p>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="font-medium mb-2">Lịch làm của bạn:</p>
                    {loading ? (
                      <p>Đang tải...</p>
                    ) : Object.keys(schedule).length > 0 ? (
                      Object.entries(schedule).map(([date, shifts]) => (
                        <div key={date} className="mb-2">
                          <p className="font-medium">{date}:</p>
                          {shifts.length > 0 ? (
                            shifts.map((shift, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center"
                              >
                                <p>
                                  {shift.shiftName}: {shift.startTime} -{" "}
                                  {shift.endTime}
                                </p>
                                <button
                                  onClick={() =>
                                    handleCancelShift(shift.staffShiftId)
                                  }
                                  className="text-red-500 hover:text-red-700"
                                >
                                  Hủy
                                </button>
                              </div>
                            ))
                          ) : (
                            <p>Chưa có ca nào</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Chưa có lịch làm việc.</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setIsShiftModalOpen(false)}
                    className="px-8 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-md"
                    style={{ backgroundColor: "#C2410C" }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {isScheduleModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 z-50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <button
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-bold mx-auto">
                    Xếp ca làm
                  </h2>
                </div>
                <form onSubmit={handleShiftSubmit}>
                  <div className="mb-4">
                    <h3 className="font-bold text-lg mb-2">
                      Nhân viên: {label(WORK_SHIFT_LABEL, staffData.workShift)}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày
                        </label>
                        <select
                          name="day"
                          value={shiftForm.day}
                          onChange={handleShiftFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        >
                          {currentShiftModel.days.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ca
                        </label>
                        {shiftOptions.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            Chưa có ca làm nào. Vui lòng nhờ quản trị viên tạo ca.
                          </p>
                        ) : (
                          <select
                            name="shiftId"
                            value={shiftForm.shiftId}
                            onChange={handleShiftFormChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md"
                          >
                            {shiftOptions.map((shift) => (
                              <option key={shift.shiftId} value={shift.shiftId}>
                                {shift.name} ({hhmm(shift.startTime)} – {hhmm(shift.endTime)})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-6 space-x-4">
                    <button
                      type="submit"
                      className="px-8 py-3 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors shadow-md"
                      style={{ backgroundColor: "#C2410C" }}
                      disabled={loading || !shiftForm.shiftId}
                    >
                      {loading ? "Đang lưu..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsScheduleModalOpen(false)}
                      className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-md"
                      disabled={loading}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 bg-cream p-8 relative z-20">
          <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-lg">
            <div
              className="w-full h-50 bg-cover bg-center relative"
              style={{
                backgroundImage: "url('/img/StaffInforBG.jpg')",
              }}
            >
              <div className="absolute bottom-0 left-64 text-white pb-1">
                <h2 className="text-lg font-bold">{staffData.fullname}</h2>
                <p className="text-sm">Chức vụ: {label(POSITION_LABEL, staffData.position)}</p>
              </div>
            </div>
            <div className="bg-cream p-8 relative">
              <div className="absolute -top-16 left-24">
                <div
                  className="p-1 bg-white rounded-full shadow-lg cursor-pointer"
                  onClick={handleAvatarClick} // Changed to handleAvatarClick for dropdown
                >
                  <img
                    src="/img/MyDung.jpg"
                    alt="Ảnh nhân viên"
                    className="w-32 h-32 rounded-full border-2 border-white object-cover"
                  />
                </div>
              </div>
              <div className="w-full flex pt-20 gap-6">
                <div className="w-1/3 flex flex-col gap-4">
                  <div className="bg-brand-soft rounded-lg border border-gray-200 p-2">
                    <button
                      className="w-full text-left flex items-center px-4 py-2 text-brand hover:bg-gray-100 rounded-lg"
                      onClick={() => {
                        console.log("Edit button clicked");
                        setIsEditModalOpen(true);
                      }}
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
                  <div className="bg-brand-soft rounded-lg border border-gray-200 p-2">
                    <button
                      className="w-full text-left flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={() => {
                        console.log("View shift button clicked");
                        setIsShiftModalOpen(true);
                      }}
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
                      onClick={() => {
                        console.log("Schedule shift button clicked");
                        setIsScheduleModalOpen(true);
                      }}
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
                      onClick={() => {
                        console.log("Change password button clicked");
                        setIsPasswordModalOpen(true);
                      }}
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
                    <button
                      className="w-full text-left flex items-center px-4 py-2 text-red-500 hover:bg-gray-100 rounded-lg"
                      onClick={() => {
                        console.log("Main UI Logout button: onClick triggered");
                        handleLogout();
                      }}
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
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                </div>
                <div className="w-2/3">
                  <div className="bg-brand-soft p-6 rounded-lg">
                    <div className="grid grid-cols-1 gap-3">
                      <p className="text-sm">
                        <strong>Họ và tên:</strong> {staffData.fullname}
                      </p>
                      <p className="text-sm">
                        <strong>Mã nhân viên:</strong> {staffData.staff_id || "N/A"}
                      </p>
                      <p className="text-sm">
                        <strong>Email:</strong> {staffData.email}
                      </p>
                      <p className="text-sm">
                        <strong>Chức vụ:</strong> {label(POSITION_LABEL, staffData.position)}
                      </p>
                      <p className="text-sm">
                        <strong>{label(WORK_SHIFT_LABEL, staffData.workShift)} | </strong> +84{" "}
                        {staffData.phone}
                      </p>
                      <p className="text-sm">
                        <strong>Lương:</strong> {staffData.salary ? `${Number(staffData.salary).toLocaleString("vi-VN")}đ` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {logoutModal}
      </div>
    );
  } catch (error) {
    console.error("StaffInformation: Render error:", error);
    return (
      <div>Không hiển thị được thông tin nhân viên. Vui lòng tải lại trang.</div>
    );
  }
};

export default StaffInformation;
