import React, { useState, useEffect, useRef } from "react";
import MenuBar from "../../../components/layout/MenuBar";
import logoRemoveBg from "../../../assets/img/logoremovebg.png";
import chefImage from "../../../assets/img/chef.png";
import { authAPI } from "../../../services/api";

const StaffManagementAdmin = () => {
  // State quản lý danh sách nhân viên
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStaff, setFilteredStaff] = useState([]);

  // State cho form thêm nhân viên
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    fullName: "",
    startDate: "",
    workShift: "",
    position: "",
    phoneNumber: "",
    address: "",
    email: "",
    salary: "",
    username: "",
    password: "",
    status: "ACTIVE",
  });

  // State cho thông báo và popup
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // State cho form chỉnh sửa nhân viên
  const [showEditForm, setShowEditForm] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);

  // State kiểm tra quyền người dùng
  const [userRole, setUserRole] = useState(null);

  // State và ref cho camera
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // State cho modal chấm công
  const [showTimekeepingModal, setShowTimekeepingModal] = useState(false);
  const [selectedStaffTimekeeping, setSelectedStaffTimekeeping] =
    useState(null);
  const [showAllTimekeepingModal, setShowAllTimekeepingModal] = useState(false);
  const [monthlySalaries, setMonthlySalaries] = useState([]);

  // State cho bộ lọc tháng/năm
  const [selectedMonthYear, setSelectedMonthYear] = useState("");

  const API_BASE_URL = "/admin";
  const SALARY_API_URL = "/salary";

  // Kiểm tra quyền admin khi component mount
  useEffect(() => {
    const role = localStorage.getItem("userType");
    setUserRole(role);
    if (role !== "ADMIN") {
      setErrorMessage("Access denied: Administrator privileges required.");
    }
  }, []);

  // Lấy header xác thực
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  });

  // Lấy danh sách nhân viên khi có quyền admin
  useEffect(() => {
    if (userRole === "ADMIN") {
      fetchStaff();
    }
  }, [userRole]);

  // Thiết lập và dọn dẹp camera stream
  useEffect(() => {
    let stream = null;
    if (showCamera && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((mediaStream) => {
          stream = mediaStream;
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              .play()
              .catch((err) => console.error("Play error:", err));
          };
        })
        .catch((error) => {
          console.error("Error accessing camera:", error);
          setErrorMessage(
            error.name === "NotAllowedError"
              ? "Camera access denied. Please grant camera permissions."
              : "Failed to access camera. Ensure a camera is available and permissions are granted."
          );
          setShowCamera(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [showCamera]);

  // Hàm lấy danh sách nhân viên
  const fetchStaff = async () => {
    try {
      const response = await authAPI.get(`${API_BASE_URL}/staff`, {
        headers: getAuthHeaders(),
      });
      const data = response.data || [];
      const mappedData = data
        .filter((item) => item.status === "ACTIVE")
        .map((item) => ({
          id: item.staff_id,
          fullName: item.fullname,
          role: item.position || "Unknown",
          workShift:
            item.position &&
            typeof item.position === "string" &&
            item.position.includes("Full")
              ? "Full-time"
              : "Part-time",
          position: item.position || "Unknown",
        }));
      setStaff(mappedData);
      setFilteredStaff(mappedData);
    } catch (error) {
      console.error("Error fetching staff:", error);
      setErrorMessage(
        error.response?.status === 403
          ? "Access denied: Administrator privileges required."
          : error.response?.data?.message || "Error while fetching staff list"
      );
    }
  };

  // Hàm lấy dữ liệu lương tháng
  const fetchMonthlySalaries = async () => {
    try {
      const response = await authAPI.get(`${SALARY_API_URL}/monthly`, {
        headers: getAuthHeaders(),
      });
      const data = response.data || [];
      const mappedData = data.map((item) => ({
        id: item.salaryId,
        staffId: item.staff.staffId,
        fullName: item.staff.fullname,
        monthYear: new Date(item.monthYear).toLocaleString("default", {
          month: "long",
          year: "numeric",
        }),
        totalWorkingHours: item.totalWorkingHours,
        hourlySalary: item.hourlySalary,
        totalSalary: item.totalSalary,
      }));
      setMonthlySalaries(mappedData);
    } catch (error) {
      console.error("Error fetching monthly salaries:", error);
      setErrorMessage(
        error.response?.status === 403
          ? "Access denied: Administrator privileges required."
          : error.response?.data?.message ||
              "Error while fetching monthly salary data"
      );
    }
  };

  // Hàm xóa nhân viên
  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      await authAPI.delete(`${API_BASE_URL}/staff/${staffToDelete.id}`, {
        headers: getAuthHeaders(),
      });
      setStaff(staff.filter((item) => item.id !== staffToDelete.id));
      setFilteredStaff(
        filteredStaff.filter((item) => item.id !== staffToDelete.id)
      );
      setShowDeletePopup(false);
      setStaffToDelete(null);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
    } catch (error) {
      console.error("Error deleting staff:", error);
      setErrorMessage(
        error.response?.status === 403
          ? "Access denied: Administrator privileges required."
          : error.response?.data?.message || "Error while deleting staff"
      );
      await fetchStaff();
    }
  };

  // Hàm tìm kiếm nhân viên
  const handleSearch = (event) => {
    if (event.key === "Enter") {
      if (searchTerm.trim() === "") {
        setFilteredStaff(staff);
      } else {
        const filtered = staff.filter((item) =>
          item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredStaff(filtered);
      }
    }
  };

  // Hàm mở popup xóa nhân viên
  const handleDeleteStaff = (staff) => {
    if (userRole !== "ADMIN") return;
    setStaffToDelete(staff);
    setShowDeletePopup(true);
  };

  // Hàm mở form chỉnh sửa nhân viên
  const handleEditStaff = (staff) => {
    if (userRole !== "ADMIN") return;
    setStaffToEdit(staff);
    setNewStaff({
      position: staff.position || staff.role,
      salary: "",
      status: "ACTIVE",
    });
    setShowEditForm(true);
  };

  // Hàm mở camera
  const startCamera = () => {
    setShowCamera(true);
  };

  // Hàm chụp ảnh từ camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/jpeg");
      setCapturedImage(imageData);
      setShowCamera(false);
    } else {
      setErrorMessage("Failed to capture photo. Please try again.");
    }
  };

  // Hàm dừng camera
  const stopCamera = () => {
    setShowCamera(false);
  };

  // Hàm hiển thị chi tiết lương tháng của nhân viên
  const handleTimekeeping = (staff) => {
    if (userRole !== "ADMIN") return;
    const staffSalaryData = monthlySalaries.filter(
      (item) => item.staffId === staff.id
    );
    setSelectedStaffTimekeeping({
      id: staff.id,
      fullName: staff.fullName,
      salaryData:
        staffSalaryData.length > 0
          ? staffSalaryData
          : [
              {
                monthYear: "N/A",
                totalWorkingHours: "N/A",
                hourlySalary: "N/A",
                totalSalary: "N/A",
              },
            ],
    });
    setShowTimekeepingModal(true);
  };

  // Hàm hiển thị tất cả bản ghi lương tháng
  const handleAllTimekeeping = async () => {
    if (userRole !== "ADMIN") return;
    await fetchMonthlySalaries();
    setShowAllTimekeepingModal(true);
  };

  // Hàm thêm nhân viên mới
  const validateAndAddStaff = async () => {
    if (userRole !== "ADMIN") return;
    if (
      !newStaff.fullName ||
      !newStaff.email ||
      !newStaff.position ||
      !newStaff.username ||
      !newStaff.password
    ) {
      setErrorMessage("Please fill in all required fields!");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStaff.email)) {
      setErrorMessage("Invalid email format!");
      return;
    }
    if (newStaff.username.length < 3 || newStaff.username.length > 50) {
      setErrorMessage("Username must be between 3 and 50 characters!");
      return;
    }
    if (newStaff.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters!");
      return;
    }
    if (newStaff.salary && isNaN(parseFloat(newStaff.salary))) {
      setErrorMessage("Salary must be a valid number!");
      return;
    }
    try {
      const formData = new FormData();
      const staffData = {
        username: newStaff.username,
        email: newStaff.email,
        password: newStaff.password,
        phone: newStaff.phoneNumber || null,
        fullname: newStaff.fullName,
        position: newStaff.position,
        salary: newStaff.salary ? newStaff.salary.toString() : null,
      };
      formData.append(
        "request",
        new Blob([JSON.stringify(staffData)], { type: "application/json" })
      );
      if (capturedImage) {
        const blob = await fetch(capturedImage).then((res) => res.blob());
        formData.append("image", blob, "profile.jpg");
      }
      await authAPI.post(`/admin/staff/register`, formData);
      await fetchStaff();
      setShowAddForm(false);
      setNewStaff({
        fullName: "",
        startDate: "",
        workShift: "",
        position: "",
        phoneNumber: "",
        address: "",
        email: "",
        salary: "",
        username: "",
        password: "",
        status: "ACTIVE",
      });
      setCapturedImage(null);
      setErrorMessage("");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
    } catch (error) {
      console.error("Error adding staff:", error);
      setErrorMessage(
        error.response?.status === 403
          ? "Access denied: Administrator privileges required."
          : error.response?.data?.message || "Error while adding staff!"
      );
    }
  };

  // Hàm cập nhật thông tin nhân viên
  const confirmEditStaff = async () => {
    if (userRole !== "ADMIN") return;
    if (!newStaff.position || !newStaff.salary) {
      setErrorMessage("Please fill in position and salary!");
      return;
    }
    const salaryValue = parseFloat(newStaff.salary);
    if (isNaN(salaryValue) || salaryValue <= 0) {
      setErrorMessage("Salary must be a positive number!");
      return;
    }
    if (!["ACTIVE", "INACTIVE"].includes(newStaff.status)) {
      setErrorMessage("Invalid status!");
      return;
    }
    try {
      await authAPI.put(
        `${API_BASE_URL}/staff/${staffToEdit.id}`,
        {
          position: newStaff.position,
          salary: newStaff.salary,
          status: newStaff.status,
        },
        { headers: getAuthHeaders() }
      );
      await fetchStaff();
      setShowEditForm(false);
      setStaffToEdit(null);
      setNewStaff({
        fullName: "",
        startDate: "",
        workShift: "",
        email: "",
        salary: "",
        username: "",
        password: "",
        status: "ACTIVE",
      });
      setErrorMessage("");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
    } catch (error) {
      console.error("Error editing staff:", error);
      setErrorMessage(
        error.response?.status === 403
          ? "Access denied: Administrator privileges required."
          : error.response?.data?.message || "Error while updating staff"
      );
    }
  };

  // Lọc dữ liệu lương tháng theo tháng/năm
  const filteredMonthlySalaries = selectedMonthYear
    ? monthlySalaries.filter((item) => item.monthYear === selectedMonthYear)
    : monthlySalaries;

  // Lấy danh sách các tháng/năm duy nhất
  const uniqueMonthYears = [
    ...new Set(monthlySalaries.map((item) => item.monthYear)),
  ];

  // Kiểm tra quyền admin
  if (userRole !== "ADMIN") {
    return (
      <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-blue-50 to-glass-100">
        <MenuBar
          title="Staff Management"
          icon="https://img.icons8.com/ios-filled/50/FFFFFF/user.png"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg text-xl">
            {errorMessage}
          </div>
        </div>
      </div>
    );
  }

  const styles = {
    outerContainer: {
      fontFamily: "Arial, sans-serif",
      backgroundColor: "rgba(157, 198, 206, 0.33)",
      minHeight: "100vh",
      width: "100vw",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "30px",
      boxSizing: "border-box",
    },
    innerContainer: {
      backgroundColor: "#F0F8FD",
      borderRadius: "10px",
      padding: "20px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      border: "3px solid rgba(0, 0, 0, 0.1)",
      width: "100%",
      maxWidth: "1200px",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
    },
    title: {
      textAlign: "center",
      fontSize: "35px",
      fontWeight: "bold",
      marginBottom: "15px",
    },
    tableAndControls: {
      display: "flex",
      alignItems: "flex-start",
      gap: "20px",
      flex: 1,
    },
    searchAndButtonContainer: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "10px",
    },
    searchRow: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "10px",
    },
    input: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      width: "200px",
    },
    chefMouseImage: {
      marginTop: "55px",
      width: "280px",
      height: "400px",
    },
    tableContainer: {
      flex: 3,
      backgroundColor: "rgba(157, 198, 206, 0.3)",
      borderRadius: "10px",
      overflowY: "auto",
      maxHeight: "500px",
      width: "100%",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      border: "2px solid #9DC6CE",
    },
    thead: {
      position: "sticky",
      top: 0,
      zIndex: 2,
      backgroundColor: "#9DC6CE",
      border: "1px solid rgb(0, 0, 0)",
    },
    th: {
      backgroundColor: "#9DC6CE",
      fontWeight: "bold",
      border: "1px solid #dddddd",
      padding: "10px",
      textAlign: "center",
    },
    td: {
      border: "1px solid #9DC6CE",
      padding: "10px",
      textAlign: "center",
    },
    price: {
      color: "#e74c3c",
      fontWeight: "bold",
    },
    oddRow: {
      backgroundColor: "rgba(157, 198, 206, 0.3)",
    },
    evenRow: {
      backgroundColor: "#FFFFFF",
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 999,
    },
    addFormContainer: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      zIndex: 1000,
      width: "800px",
      maxWidth: "90%",
      height: "auto",
      maxHeight: "90vh",
      overflowY: "auto",
    },
    addFormTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "15px",
      textAlign: "center",
    },
    addForm: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    addButton: {
      padding: "10px 20px",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    timekeepingButton: {
      padding: "8px 12px",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },
    cancelButton: {
      padding: "10px 20px",
      backgroundColor: "#e74c3c",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    addFormContent: {
      display: "flex",
      gap: "20px",
    },
    formFields: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "15px",
    },
    labelText: {
      width: "150px",
      display: "inline-block",
      fontWeight: "bold",
    },
    actionButtons: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "20px",
    },
    imageUploadContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
      cursor: "pointer",
      position: "relative",
    },
    imageUploadSection: {
      flex: "0 0 40%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      border: "1px solid #ddd",
      borderRadius: "10px",
      padding: "20px",
      backgroundColor: "#f9f9f9",
    },
    imagePreview: {
      width: "250px",
      height: "250px",
      border: "1px solid #ddd",
      borderRadius: "10px",
      overflow: "hidden",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    placeholderText: {
      fontSize: "14px",
      color: "#aaa",
      textAlign: "center",
      padding: "10px",
    },
    fileInput: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      opacity: 0,
      cursor: "pointer",
    },
    imageNote: {
      fontSize: "12px",
      color: "#555",
      textAlign: "center",
      marginTop: "10px",
    },
    formLabel: {
      fontSize: "14px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
    },
    requiredMark: {
      color: "#e74c3c",
      marginLeft: "5px",
    },
    inputField: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      fontSize: "14px",
      width: "250px",
      boxSizing: "border-box",
    },
    selectField: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      fontSize: "14px",
      width: "250px",
      boxSizing: "border-box",
    },
    textareaField: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      fontSize: "14px",
      width: "100%",
      maxWidth: "300px",
      height: "80px",
      resize: "none",
    },
    successPopup: {
      position: "fixed",
      width: "250px",
      height: "200px",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      textAlign: "center",
      zIndex: 1001,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
    successIcon: {
      fontSize: "24px",
      color: "#4CAF50",
      marginTop: "10px",
    },
    successImage: {
      width: "100px",
      height: "auto",
    },
    successText: {
      fontSize: "18px",
      fontWeight: "bold",
      marginBottom: "5px",
    },
    errorText: {
      color: "#e74c3c",
      fontSize: "14px",
      marginBottom: "10px",
      textAlign: "center",
    },
    cameraContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
      border: "1px solid #ddd",
      borderRadius: "10px",
      padding: "20px",
      backgroundColor: "#f9f9f9",
    },
    video: {
      width: "250px",
      height: "250px",
      borderRadius: "10px",
      border: "1px solid #ddd",
    },
    canvas: {
      display: "none",
    },
    capturedImage: {
      width: "250px",
      height: "250px",
      borderRadius: "10px",
      border: "1px solid #ddd",
      objectFit: "cover",
    },
    cameraButton: {
      padding: "10px 20px",
      backgroundColor: "#3498db",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    timekeepingModal: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      zIndex: 1000,
      width: "700px",
      maxWidth: "90%",
      height: "auto",
      maxHeight: "90vh",
      overflowY: "auto",
    },
    timekeepingTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "10px",
    },
    allTimekeepingTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "10px",
    },
    timekeepingTh: {
      backgroundColor: "#9DC6CE",
      fontWeight: "bold",
      border: "1px solid #dddddd",
      padding: "10px",
      textAlign: "left",
    },
    timekeepingTd: {
      border: "1px solid #9DC6CE",
      padding: "10px",
      textAlign: "left",
    },
    filterContainer: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      marginBottom: "10px",
    },
  };

  return (
    <>
      <MenuBar
        title="Staff Management"
        icon="https://img.icons8.com/ios-filled/50/FFFFFF/user.png"
      />
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          <h1 style={styles.title}>Staff</h1>
          <div style={styles.tableAndControls}>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Shifts</th>
                    <th style={styles.th}>Position</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((item, index) => (
                    <tr
                      key={item.id}
                      style={index % 2 === 0 ? styles.evenRow : styles.oddRow}
                    >
                      <td style={styles.td}>{item.id}</td>
                      <td style={styles.td}>{item.fullName}</td>
                      <td style={{ ...styles.td, ...styles.price }}>
                        {item.workShift}
                      </td>
                      <td style={styles.td}>{item.position}</td>
                      <td style={styles.td}>
                        <button
                          style={{ marginRight: "10px", cursor: "pointer" }}
                          onClick={() => handleTimekeeping(item)}
                          disabled={userRole !== "ADMIN"}
                          aria-label="View Timekeeping"
                        >
                          ⏰
                        </button>
                        <button
                          style={{ marginRight: "10px", cursor: "pointer" }}
                          onClick={() => handleEditStaff(item)}
                          disabled={userRole !== "ADMIN"}
                          aria-label="Edit Staff"
                        >
                          ✏️
                        </button>
                        <button
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDeleteStaff(item)}
                          disabled={userRole !== "ADMIN"}
                          aria-label="Delete Staff"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={styles.searchAndButtonContainer}>
              <div style={styles.searchRow}>
                <input
                  type="text"
                  placeholder="Search by name..."
                  style={styles.input}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  disabled={userRole !== "ADMIN"}
                  aria-label="Search staff"
                />
                <button
                  style={styles.addButton}
                  onClick={() => setShowAddForm(true)}
                  disabled={userRole !== "ADMIN"}
                  aria-label="Add new staff"
                >
                  +
                </button>
                <button
                  style={styles.timekeepingButton}
                  onClick={handleAllTimekeeping}
                  disabled={userRole !== "ADMIN"}
                  aria-label="View all timekeeping records"
                >
                  ⏰ Timekeeping
                </button>
              </div>
              <img src={chefImage} alt="Chef" style={styles.chefMouseImage} />
            </div>
          </div>

          {/* Form thêm nhân viên */}
          {showAddForm && (
            <>
              <div
                style={styles.overlay}
                onClick={() => {
                  setShowAddForm(false);
                  stopCamera();
                }}
              ></div>
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Add Staff</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    <div style={styles.formFields}>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Name<span style={styles.requiredMark}>*</span>:
                        </span>
                        <input
                          type="text"
                          value={newStaff.fullName}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              fullName: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>Start Date:</span>
                        <input
                          type="date"
                          value={newStaff.startDate}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              startDate: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>Shift:</span>
                        <select
                          value={newStaff.workShift}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              workShift: e.target.value,
                            })
                          }
                          style={styles.selectField}
                        >
                          <option value="">Select a shift</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                        </select>
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Position<span style={styles.requiredMark}>*</span>:
                        </span>
                        <input
                          type="text"
                          value={newStaff.position}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              position: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>Phone Number:</span>
                        <input
                          type="text"
                          value={newStaff.phoneNumber}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              phoneNumber: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>Address:</span>
                        <input
                          type="text"
                          value={newStaff.address}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              address: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Email<span style={styles.requiredMark}>*</span>:
                        </span>
                        <input
                          type="text"
                          value={newStaff.email}
                          onChange={(e) =>
                            setNewStaff({ ...newStaff, email: e.target.value })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>Salary:</span>
                        <input
                          type="number"
                          value={newStaff.salary}
                          onChange={(e) =>
                            setNewStaff({ ...newStaff, salary: e.target.value })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Username<span style={styles.requiredMark}>*</span>:
                        </span>
                        <input
                          type="text"
                          value={newStaff.username}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              username: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Password<span style={styles.requiredMark}>*</span>:
                        </span>
                        <input
                          type="password"
                          value={newStaff.password}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              password: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                    </div>
                    <div style={styles.cameraContainer}>
                      {showCamera ? (
                        <>
                          <video ref={videoRef} autoPlay style={styles.video} />
                          <button
                            onClick={capturePhoto}
                            style={styles.cameraButton}
                          >
                            Capture Photo
                          </button>
                        </>
                      ) : capturedImage ? (
                        <>
                          <img
                            src={capturedImage}
                            alt="Captured Face"
                            style={styles.capturedImage}
                          />
                          <button
                            onClick={startCamera}
                            style={styles.cameraButton}
                          >
                            Retake Photo
                          </button>
                        </>
                      ) : (
                        <>
                          <div style={styles.capturedImage}>
                            <p style={styles.placeholderText}>
                              No photo captured
                            </p>
                          </div>
                          <button
                            onClick={startCamera}
                            style={styles.cameraButton}
                          >
                            Open Camera
                          </button>
                        </>
                      )}
                      <p style={styles.imageNote}>
                        Please capture a clear photo of the staff's face.
                      </p>
                    </div>
                    <canvas ref={canvasRef} style={styles.canvas} />
                  </div>
                  {errorMessage && (
                    <p style={styles.errorText}>{errorMessage}</p>
                  )}
                  <div style={styles.actionButtons}>
                    <button
                      onClick={validateAndAddStaff}
                      style={styles.addButton}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        stopCamera();
                      }}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Popup thành công */}
          {showSuccessPopup && (
            <div style={styles.successPopup}>
              <img
                src={logoRemoveBg}
                alt="Success"
                style={styles.successImage}
              />
              <p style={styles.successText}>Successful</p>
              <div style={styles.successIcon}>✔</div>
            </div>
          )}

          {/* Popup xác nhận xóa */}
          {showDeletePopup && (
            <div style={styles.successPopup}>
              <img
                src={logoRemoveBg}
                alt="Confirm Delete"
                style={styles.successImage}
              />
              <p style={styles.successText}>Are you sure?</p>
              <div style={styles.actionButtons}>
                <button onClick={confirmDeleteStaff} style={styles.addButton}>
                  Yes
                </button>
                <button
                  onClick={() => setShowDeletePopup(false)}
                  style={styles.cancelButton}
                >
                  No
                </button>
              </div>
            </div>
          )}

          {/* Form chỉnh sửa nhân viên */}
          {showEditForm && (
            <>
              <div
                style={styles.overlay}
                onClick={() => setShowEditForm(false)}
              ></div>
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Edit Staff</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    <div style={styles.formFields}>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Position<span style={styles.requiredMark}>*</span>:
                        </span>
                        <input
                          type="text"
                          value={newStaff.position}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              position: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Salary<span style={styles.requiredMark}>*</span>:
                        </span>
                        <input
                          type="number"
                          value={newStaff.salary}
                          onChange={(e) =>
                            setNewStaff({ ...newStaff, salary: e.target.value })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Status<span style={styles.requiredMark}>*</span>:
                        </span>
                        <select
                          value={newStaff.status}
                          onChange={(e) =>
                            setNewStaff({ ...newStaff, status: e.target.value })
                          }
                          style={styles.selectField}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  {errorMessage && (
                    <p style={styles.errorText}>{errorMessage}</p>
                  )}
                  <div style={styles.actionButtons}>
                    <button onClick={confirmEditStaff} style={styles.addButton}>
                      Save
                    </button>
                    <button
                      onClick={() => setShowEditForm(false)}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Modal chi tiết lương tháng của nhân viên */}
          {showTimekeepingModal && selectedStaffTimekeeping && (
            <>
              <div
                style={styles.overlay}
                onClick={() => setShowTimekeepingModal(false)}
              ></div>
              <div style={styles.timekeepingModal}>
                <h2 style={styles.addFormTitle}>
                  Salary Details for {selectedStaffTimekeeping.fullName}
                </h2>
                <table style={styles.timekeepingTable}>
                  <thead>
                    <tr>
                      <th style={styles.timekeepingTh}>Month/Year</th>
                      <th style={styles.timekeepingTh}>Working Hours</th>
                      <th style={styles.timekeepingTh}>Hourly Salary</th>
                      <th style={styles.timekeepingTh}>Total Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStaffTimekeeping.salaryData.map(
                      (record, index) => (
                        <tr key={index}>
                          <td style={styles.timekeepingTd}>
                            {record.monthYear}
                          </td>
                          <td style={styles.timekeepingTd}>
                            {record.totalWorkingHours}
                          </td>
                          <td style={styles.timekeepingTd}>
                            {record.hourlySalary}
                          </td>
                          <td style={styles.timekeepingTd}>
                            {record.totalSalary}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
                <div style={styles.actionButtons}>
                  <button
                    onClick={() => setShowTimekeepingModal(false)}
                    style={styles.cancelButton}
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Modal tất cả bản ghi lương tháng */}
          {showAllTimekeepingModal && (
            <>
              <div
                style={styles.overlay}
                onClick={() => setShowAllTimekeepingModal(false)}
              ></div>
              <div style={styles.timekeepingModal}>
                <h2 style={styles.addFormTitle}>All Monthly Salary Records</h2>
                <div style={styles.filterContainer}>
                  <label style={styles.formLabel}>
                    <span style={styles.labelText}>Filter by Month/Year:</span>
                    <select
                      value={selectedMonthYear}
                      onChange={(e) => setSelectedMonthYear(e.target.value)}
                      style={styles.selectField}
                    >
                      <option value="">All</option>
                      {uniqueMonthYears.map((monthYear) => (
                        <option key={monthYear} value={monthYear}>
                          {monthYear}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <table style={styles.allTimekeepingTable}>
                  <thead>
                    <tr>
                      <th style={styles.timekeepingTh}>Staff ID</th>
                      <th style={styles.timekeepingTh}>Name</th>
                      <th style={styles.timekeepingTh}>Month/Year</th>
                      <th style={styles.timekeepingTh}>Working Hours</th>
                      <th style={styles.timekeepingTh}>Hourly Salary</th>
                      <th style={styles.timekeepingTh}>Total Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMonthlySalaries.length > 0 ? (
                      filteredMonthlySalaries.map((item) => (
                        <tr key={item.id}>
                          <td style={styles.timekeepingTd}>{item.staffId}</td>
                          <td style={styles.timekeepingTd}>{item.fullName}</td>
                          <td style={styles.timekeepingTd}>{item.monthYear}</td>
                          <td style={styles.timekeepingTd}>
                            {item.totalWorkingHours}
                          </td>
                          <td style={styles.timekeepingTd}>
                            {item.hourlySalary}
                          </td>
                          <td style={styles.timekeepingTd}>
                            {item.totalSalary}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          style={{
                            ...styles.timekeepingTd,
                            textAlign: "center",
                          }}
                        >
                          No salary records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div style={styles.actionButtons}>
                  <button
                    onClick={() => setShowAllTimekeepingModal(false)}
                    style={styles.cancelButton}
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default StaffManagementAdmin;
