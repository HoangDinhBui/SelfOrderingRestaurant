import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MenuBar from "../../../components/layout/MenuBar";

// Shift models data
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

// Available time slots
const timeSlots = [
  "7:30am - 12:30pm",
  "12:30pm - 17:30pm",
  "17:30pm - 22:30pm",
];

const StaffInformation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [staffData, setStaffData] = useState({
    fullName: "Tran Thi My Dung",
    startDate: "01/02/2024",
    workShift: "Full-time",
    position: "Service staff",
    phone: "0987654321",
    address: "448 Le Van Viet Street, District 9",
    email: "MDXD1234@gmail.com",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const [shiftForm, setShiftForm] = useState({
    day: shiftModels["Full-time"].days[0],
    timeSlot: timeSlots[0],
  });

  const [schedule, setSchedule] = useState({});

  // Ánh xạ timeSlot sang shiftId
  const timeSlotToShiftId = {
    "7:30am - 12:30pm": 1, // Morning
    "12:30pm - 17:30pm": 2, // Afternoon
    "17:30pm - 22:30pm": 3, // Evening
  };

  // Hàm chuyển đổi ngày thành LocalDate
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
    return today.toISOString().split("T")[0]; // Format yyyy-mm-dd
  };

  // Hàm làm mới accessToken
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }
      const response = await axios.post(
        "http://localhost:8080/api/auth/refresh-token",
        {
          refreshToken,
        }
      );
      const newAccessToken = response.data.accessToken;
      localStorage.setItem("accessToken", newAccessToken);
      return newAccessToken;
    } catch (error) {
      toast.error("Session expired. Please log in again.");
      // Có thể chuyển hướng đến trang đăng nhập
      // window.location.href = "/login";
      throw error;
    }
  };

  // Lấy lịch làm việc
  const fetchSchedule = async () => {
    setLoading(true);
    let accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Please log in to view your schedule");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        "http://localhost:8080/api/staff/shifts/my-schedule",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setSchedule(response.data);
      toast.success("Schedule loaded successfully!");
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          accessToken = await refreshAccessToken();
          const retryResponse = await axios.get(
            "http://localhost:8080/api/staff/shifts/my-schedule",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          setSchedule(retryResponse.data);
          toast.success("Schedule loaded successfully!");
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      } else if (error.response?.status === 403) {
        toast.error(
          "Access denied: Please check your account permissions or contact admin"
        );
      } else {
        toast.error(error.response?.data?.message || "Failed to load schedule");
      }
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleAvatarClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleAvatarModal = () => {
    setIsAvatarModalOpen(!isAvatarModalOpen);
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
    toast.success("Staff information saved!");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setIsPasswordModalOpen(false);
    setPasswordData({ oldPassword: "", newPassword: "" });
    toast.success("Password changed!");
  };

  const handleShiftSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Please log in to register a shift");
      setLoading(false);
      return;
    }

    const shiftRegistration = {
      shiftId: timeSlotToShiftId[shiftForm.timeSlot],
      date: dayToDate(shiftForm.day),
    };

    try {
      await axios.post(
        "http://localhost:8080/api/staff/shifts/register",
        shiftRegistration,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      toast.success("Shift registered successfully!");
      fetchSchedule(); // Làm mới lịch
      setShiftForm({
        day: shiftModels[staffData.workShift].days[0],
        timeSlot: timeSlots[0],
      });
      setIsScheduleModalOpen(false);
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          accessToken = await refreshAccessToken();
          await axios.post(
            "http://localhost:8080/api/staff/shifts/register",
            shiftRegistration,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          toast.success("Shift registered successfully!");
          fetchSchedule();
          setShiftForm({
            day: shiftModels[staffData.workShift].days[0],
            timeSlot: timeSlots[0],
          });
          setIsScheduleModalOpen(false);
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      } else if (error.response?.status === 403) {
        toast.error(
          "Access denied: Please check your account permissions or contact admin"
        );
      } else {
        toast.error(
          error.response?.data?.message || "Failed to register shift"
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
      toast.error("Please log in to cancel a shift");
      setLoading(false);
      return;
    }

    try {
      await axios.delete(
        `http://localhost:8080/api/staff/shifts/${staffShiftId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      toast.success("Shift cancelled successfully!");
      fetchSchedule();
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          accessToken = await refreshAccessToken();
          await axios.delete(
            `http://localhost:8080/api/staff/shifts/${staffShiftId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          toast.success("Shift cancelled successfully!");
          fetchSchedule();
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      } else if (error.response?.status === 403) {
        toast.error(
          "Access denied: Please check your account permissions or contact admin"
        );
      } else {
        toast.error(error.response?.data?.message || "Failed to cancel shift");
      }
    } finally {
      setLoading(false);
    }
  };

  const currentShiftModel = shiftModels[staffData.workShift];

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col relative">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Header */}
      <MenuBar
        title="Profile"
        icon="https://img.icons8.com/?size=100&id=34105&format=png&color=FFFFFF"
      />

      {/* Avatar Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Profile Picture</h2>
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
                src="./src/assets/img/MyDung.jpg"
                alt="User Avatar Large"
                className="w-48 h-48 rounded-full border-2 border-gray-200 mb-4 object-cover"
              />
              <div className="flex space-x-4 mt-4">
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Change Photo
                </button>
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  onClick={toggleAvatarModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div className="absolute mt-5 top-12 right-15 bg-white rounded-lg shadow-lg z-30 w-48 border-1 border-gray">
          <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
            Profile
          </button>
          <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
            Log out
          </button>
        </div>
      )}

      {/* Edit Staff Information Modal */}
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
                  Staff Information
                </h2>
              </div>
              <form onSubmit={handleSubmit}>
                <table className="w-full border-collapse mb-8">
                  <tbody>
                    <tr className="border border-gray-300">
                      <td className="py-3 px-6 font-medium border-r border-gray-300 text-center w-1/3">
                        Full name
                      </td>
                      <td className="py-3 px-6">
                        <input
                          type="text"
                          name="fullName"
                          value={staffData.fullName}
                          onChange={handleInputChange}
                          className="w-full border-none outline-none bg-transparent"
                          placeholder="Enter full name"
                        />
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">
                        Start date of work
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
                        Work shift
                      </td>
                      <td className="py-3 px-6">
                        <select
                          name="workShift"
                          value={staffData.workShift}
                          onChange={handleInputChange}
                          className="w-full border-none outline-none bg-transparent"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                        </select>
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">
                        Employee position
                      </td>
                      <td className="py-3 px-6">
                        <select
                          name="position"
                          value={staffData.position}
                          onChange={handleInputChange}
                          className="w-full border-none outline-none bg-transparent"
                        >
                          <option value="Service staff">Service staff</option>
                          <option value="Manager">Manager</option>
                          <option value="Supervisor">Supervisor</option>
                        </select>
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">
                        Phone number
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
                            placeholder="Enter phone number"
                          />
                        </div>
                      </td>
                    </tr>
                    <tr className="border border-gray-300">
                      <td className="py-3 px-6 font-medium border-r border-gray-300 text-center">
                        Address
                      </td>
                      <td className="py-3 px-6">
                        <input
                          type="text"
                          name="address"
                          value={staffData.address}
                          onChange={handleInputChange}
                          className="w-full border-none outline-none bg-transparent"
                          placeholder="Enter address"
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
                          placeholder="Enter email"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                    style={{ backgroundColor: "#000000" }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
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
                <h2 className="text-2xl font-bold mx-auto">Change password</h2>
              </div>
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Old password
                    </label>
                    <input
                      type="password"
                      name="oldPassword"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter old password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    type="submit"
                    className="px-8 py-3 text-white rounded-lg transition-colors shadow-md"
                    style={{ backgroundColor: "#000000" }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Shift Information Modal */}
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
                  Shift Information
                </h2>
              </div>
              <div className="mb-4">
                <p className="font-medium text-center mb-2">
                  Staff: {staffData.workShift}
                </p>
                <div className="border-t border-gray-200 pt-4">
                  <p className="font-medium mb-2">Your Schedule:</p>
                  {loading ? (
                    <p>Loading...</p>
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
                                Cancel
                              </button>
                            </div>
                          ))
                        ) : (
                          <p>No shifts scheduled</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No schedule available.</p>
                  )}
                </div>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setIsShiftModalOpen(false)}
                  className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                  style={{ backgroundColor: "#000000" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Shift Modal */}
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
                <h2 className="text-2xl font-bold mx-auto">Schedule a shift</h2>
              </div>
              <form onSubmit={handleShiftSubmit}>
                <div className="mb-4">
                  <h3 className="font-bold text-lg mb-2">
                    Staff: {staffData.workShift}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day
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
                        Time Slot
                      </label>
                      <select
                        name="timeSlot"
                        value={shiftForm.timeSlot}
                        onChange={handleShiftFormChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      >
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center mt-6 space-x-4">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                    style={{ backgroundColor: "#000000" }}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors shadow-md"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 bg-gray-100 p-8 relative z-20">
        <div className="w-full h-full bg-white rounded-xl overflow-hidden shadow-lg">
          {/* Top image banner */}
          <div
            className="w-full h-50 bg-cover bg-center relative"
            style={{
              backgroundImage: "url('./src/assets/img/StaffInforBG.jpg')",
            }}
          >
            <div className="absolute bottom-0 left-64 text-white pb-1">
              <h2 className="text-lg font-bold">Tran Thi My Dung</h2>
              <p className="text-sm">Position: Staff</p>
            </div>
          </div>
          <div className="bg-gray-100 p-8 relative">
            <div className="absolute -top-16 left-24">
              <div
                className="p-1 bg-white rounded-full shadow-lg cursor-pointer"
                onClick={toggleAvatarModal}
              >
                <img
                  src="./src/assets/img/MyDung.jpg"
                  alt="Staff Avatar"
                  className="w-32 h-32 rounded-full border-2 border-white object-cover"
                />
              </div>
            </div>
            <div className="w-full flex pt-20 gap-6">
              <div className="w-1/3 flex flex-col gap-4">
                <div className="bg-blue-100 rounded-lg border border-gray-200 p-2">
                  <button
                    className="w-full text-left flex items-center px-4 py-2 text-blue-500 hover:bg-gray-100 rounded-lg"
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
                    Edit staff information
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
                      Language
                    </div>
                    <span className="text-blue-500">English</span>
                  </div>
                </div>
                <div className="bg-blue-100 rounded-lg border border-gray-200 p-2">
                  <button
                    className="w-full text-left flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsShiftModalOpen(true)}
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
                    View shift
                  </button>
                  <button
                    className="w-full text-left flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                    onClick={() => setIsScheduleModalOpen(true)}
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
                    Schedule a shift
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
                    Change username & password
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
                    Logout
                  </button>
                </div>
              </div>
              <div className="w-2/3">
                <div className="bg-blue-100 p-6 rounded-lg">
                  <div className="grid grid-cols-1 gap-3">
                    <p className="text-sm">
                      <strong>Full Name:</strong> {staffData.fullName}
                    </p>
                    <p className="text-sm">
                      <strong>Staff Id:</strong> 1
                    </p>
                    <p className="text-sm">
                      <strong>Email:</strong> {staffData.email}
                    </p>
                    <p className="text-sm">
                      <strong>Position:</strong> {staffData.position}
                    </p>
                    <p className="text-sm">
                      <strong>{staffData.workShift} | </strong> +84{" "}
                      {staffData.phone}
                    </p>
                    <p className="text-sm">
                      <strong>Salary:</strong> $390.08
                    </p>
                    <p className="text-sm">
                      <strong>Address:</strong> {staffData.address}
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

export default StaffInformation;
