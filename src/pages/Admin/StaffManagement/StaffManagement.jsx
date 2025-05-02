import React, { useState, useEffect } from "react";
import MenuBar from "../../../components/layout/menuBar";
import logoRemoveBg from "../../../assets/img/logoremovebg.png";

const StaffManagementAdmin = () => {
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStaff, setFilteredStaff] = useState([]);
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
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState(null);

  // API base URL
  const API_BASE_URL = "http://localhost:8080/api/admin";

  // Lấy token từ localStorage
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  // Lấy danh sách nhân viên khi component mount
  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Lỗi khi lấy danh sách nhân viên");
      }
      const data = await response.json();
      // Ánh xạ dữ liệu từ backend sang định dạng frontend
      const mappedData = data.map((item) => ({
        id: item.staff_id,
        fullName: item.fullname,
        role: item.role,
        workShift: item.role.includes("Full") ? "Full-time" : "Part-time", // Giả định
        position: item.role, // Giả định
      }));
      setStaff(mappedData);
      setFilteredStaff(mappedData);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Xử lý tìm kiếm cục bộ
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

  // Xử lý xóa nhân viên
  const handleDeleteStaff = (staff) => {
    setStaffToDelete(staff);
    setShowDeletePopup(true);
  };

  const confirmDeleteStaff = async () => {
    try {
      // Optimistically update the UI by removing the staff from local state
      const updatedStaff = staff.filter((item) => item.id !== staffToDelete.id);
      const updatedFilteredStaff = filteredStaff.filter((item) => item.id !== staffToDelete.id);
      setStaff(updatedStaff);
      setFilteredStaff(updatedFilteredStaff);

      const response = await fetch(`${API_BASE_URL}/staff/${staffToDelete.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        // If the backend fails, revert the optimistic update
        await fetchStaff();
        throw new Error("Lỗi khi xóa nhân viên");
      }
      setShowDeletePopup(false);
      setStaffToDelete(null);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Xử lý sửa nhân viên
  const handleEditStaff = (staff) => {
    setStaffToEdit(staff);
    setNewStaff({
      fullName: staff.fullName,
      startDate: "",
      workShift: staff.workShift,
      position: staff.position || staff.role,
      phoneNumber: "",
      address: "",
      email: "",
      salary: "",
      username: "",
      password: "",
      status: "ACTIVE",
    });
    setShowEditForm(true);
  };

  const confirmEditStaff = async () => {
    if (!newStaff.position || !newStaff.salary) {
      setErrorMessage("Vui lòng điền vị trí và lương!");
      return;
    }
    try {
      const updateStaffDTO = {
        position: newStaff.position,
        salary: parseFloat(newStaff.salary),
        status: newStaff.status,
      };
      const response = await fetch(`${API_BASE_URL}/staff/${staffToEdit.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updateStaffDTO),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Lỗi khi cập nhật nhân viên");
      }
      await fetchStaff();
      setShowEditForm(false);
      setStaffToEdit(null);
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
      setErrorMessage("");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Xử lý thêm nhân viên
  const validateAndAddStaff = async () => {
    // Kiểm tra các trường bắt buộc
    if (
      !newStaff.fullName ||
      !newStaff.email ||
      !newStaff.position ||
      !newStaff.username ||
      !newStaff.password
    ) {
      setErrorMessage("Vui lòng điền đầy đủ các trường bắt buộc!");
      return;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newStaff.email)) {
      setErrorMessage("Email không đúng định dạng!");
      return;
    }

    // Kiểm tra độ dài username
    if (newStaff.username.length < 3 || newStaff.username.length > 50) {
      setErrorMessage("Tên đăng nhập phải từ 3 đến 50 ký tự!");
      return;
    }

    // Kiểm tra độ dài password
    if (newStaff.password.length < 8) {
      setErrorMessage("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }

    // Kiểm tra lương (nếu có)
    if (newStaff.salary && isNaN(parseFloat(newStaff.salary))) {
      setErrorMessage("Lương phải là số hợp lệ!");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/staff/register`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: newStaff.username,
          email: newStaff.email,
          password: newStaff.password,
          phone: newStaff.phoneNumber,
          fullname: newStaff.fullName,
          position: newStaff.position,
          salary: newStaff.salary ? parseFloat(newStaff.salary) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          setErrorMessage(errorData.message || "Dữ liệu không hợp lệ!");
        } else if (response.status === 409) {
          setErrorMessage("Tên đăng nhập hoặc email đã tồn tại!");
        } else {
          setErrorMessage(errorData.message || "Lỗi khi thêm nhân viên!");
        }
        throw new Error(errorData.message);
      }

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
      setErrorMessage("");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const styles = {
    outerContainer: {
      fontFamily: "Arial, sans-serif",
      backgroundColor: "rgba(157, 198, 206, 0.33)",
      minHeight: "auto",
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
      padding: "0 0 10px ",
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
      flex: "1",
      display: "flex",
      flexDirection: "column",
      gap: "15px",
    },
    labelText: {
      width: "150px",
      display: "inline-block",
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
  };

  return (
    <>
      <MenuBar
        title="Quản lý Nhân viên"
        icon="https://img.icons8.com/ios-filled/50/FFFFFF/user.png"
      />
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          <h1 style={styles.title}>Nhân viên</h1>
          <div style={styles.tableAndControls}>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Tên</th>
                    <th style={styles.th}>Ca làm</th>
                    <th style={styles.th}>Vị trí</th>
                    <th style={styles.th}></th>
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
                          onClick={() => handleEditStaff(item)}
                        >
                          ✏️
                        </button>
                        <button
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDeleteStaff(item)}
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
                  placeholder="Tìm kiếm..."
                  style={styles.input}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                />
                <button
                  style={styles.addButton}
                  onClick={() => setShowAddForm(true)}
                >
                  +
                </button>
              </div>
              <img
                src="./src/assets/img/chef.png"
                alt="Chef"
                style={styles.chefMouseImage}
              />
            </div>
          </div>

          {showAddForm && (
            <>
              <div
                style={styles.overlay}
                onClick={() => setShowAddForm(false)}
              ></div>
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Thêm Nhân viên</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    <div style={styles.formFields}>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Họ tên <span style={styles.requiredMark}>(*)</span>:
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
                        <span style={styles.labelText}>
                          Ngày bắt đầu:
                        </span>
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
                        <span style={styles.labelText}>
                          Ca làm:
                        </span>
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
                          <option value="">Chọn ca</option>
                          <option value="Full-time">Toàn thời gian</option>
                          <option value="Part-time">Bán thời gian</option>
                        </select>
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Vị trí <span style={styles.requiredMark}>(*)</span>:
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
                          Số điện thoại:
                        </span>
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
                        <span style={styles.labelText}>
                          Địa chỉ:
                        </span>
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
                          Email <span style={styles.requiredMark}>(*)</span>:
                        </span>
                        <input
                          type="text"
                          value={newStaff.email}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              email: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Lương:
                        </span>
                        <input
                          type="number"
                          value={newStaff.salary}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              salary: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Tên đăng nhập{" "}
                          <span style={styles.requiredMark}>(*)</span>:
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
                          Mật khẩu <span style={styles.requiredMark}>(*)</span>:
                        </span>
                        <input
                          type="text"
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
                  </div>
                  {errorMessage && (
                    <p style={styles.errorText}>{errorMessage}</p>
                  )}
                  <div style={styles.actionButtons}>
                    <button
                      onClick={validateAndAddStaff}
                      style={styles.addButton}
                    >
                      Thêm
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      style={styles.cancelButton}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {showSuccessPopup && (
            <div style={styles.successPopup}>
              <img
                src={logoRemoveBg}
                alt="Bon Appétit"
                style={styles.successImage}
              />
              <p>
                <b>Thành công</b>
              </p>
              <div style={styles.successIcon}>✔</div>
            </div>
          )}

          {showDeletePopup && (
            <div style={styles.successPopup}>
              <img
                src={logoRemoveBg}
                alt="Bon Appétit"
                style={styles.successImage}
              />
              <p>
                <b>Bạn có chắc chắn?</b>
              </p>
              <div style={styles.actionButtons}>
                <button onClick={confirmDeleteStaff} style={styles.addButton}>
                  Có
                </button>
                <button
                  onClick={() => setShowDeletePopup(false)}
                  style={styles.cancelButton}
                >
                  Không
                </button>
              </div>
            </div>
          )}

          {showEditForm && (
            <>
              <div
                style={styles.overlay}
                onClick={() => setShowEditForm(false)}
              ></div>
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Sửa Nhân viên</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    <div style={styles.formFields}>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Vị trí <span style={styles.requiredMark}>(*)</span>:
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
                          Lương <span style={styles.requiredMark}>(*)</span>:
                        </span>
                        <input
                          type="number"
                          value={newStaff.salary}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              salary: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Trạng thái <span style={styles.requiredMark}>(*)</span>:
                        </span>
                        <select
                          value={newStaff.status}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              status: e.target.value,
                            })
                          }
                          style={styles.selectField}
                        >
                          <option value="ACTIVE">Hoạt động</option>
                          <option value="INACTIVE">Không hoạt động</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  {errorMessage && (
                    <p style={styles.errorText}>{errorMessage}</p>
                  )}
                  <div style={styles.actionButtons}>
                    <button onClick={confirmEditStaff} style={styles.addButton}>
                      Lưu
                    </button>
                    <button
                      onClick={() => setShowEditForm(false)}
                      style={styles.cancelButton}
                    >
                      Hủy
                    </button>
                  </div>
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