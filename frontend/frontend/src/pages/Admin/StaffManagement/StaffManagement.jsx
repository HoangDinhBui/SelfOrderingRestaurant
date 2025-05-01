import React from "react";
import { useState } from "react";
import MenuBar from "../../../components/layout/menuBar";
import logoRemoveBg from "../../../assets/img/logoremovebg.png";

const StaffManagementAdmin = () => {
  const [staff, setStaff] = useState([
    {
      id: 1,
      fullName: "Tran Thi My Dung",
      startDate: "01/02/2024",
      workShift: "Full time",
      employeePosition: "Service staff",
      phoneNumber: "0987654321",
      address: "448 Le Van Viet Street, District 9",
      email: "MDX01234@gmail.com",
      salary: 3900000,
      username: "staff1234",
      password: "123456",
    },
    {
      id: 2,
      fullName: "Tran Thi My Dung",
      startDate: "01/02/2024",
      workShift: "Full time",
      employeePosition: "Service staff",
      phoneNumber: "0987654321",
      address: "448 Le Van Viet Street, District 9",
      email: "MDX01234@gmail.com",
      salary: 3900000,
      username: "staff1234",
      password: "123456",
    },
    {
      id: 3,
      fullName: "Tran Thi My Dung",
      startDate: "01/02/2024",
      workShift: "Full time",
      employeePosition: "Service staff",
      phoneNumber: "0987654321",
      address: "448 Le Van Viet Street, District 9",
      email: "MDX01234@gmail.com",
      salary: 3900000,
      username: "staff1234",
      password: "123456",
    },
    {
      id: 4,
      fullName: "Tran Thi My Dung",
      startDate: "01/02/2024",
      workShift: "Full time",
      employeePosition: "Service staff",
      phoneNumber: "0987654321",
      address: "448 Le Van Viet Street, District 9",
      email: "MDX01234@gmail.com",
      salary: 3900000,
      username: "staff1234",
      password: "123456",
    },
    {
      id: 5,
      fullName: "Tran Thi My Dung",
      startDate: "01/02/2024",
      workShift: "Full time",
      employeePosition: "Service staff",
      phoneNumber: "0987654321",
      address: "448 Le Van Viet Street, District 9",
      email: "MDX01234@gmail.com",
      salary: 3900000,
      username: "staff1234",
      password: "123456",
    },
    {
      id: 6,
      fullName: "Tran Thi My Dung",
      startDate: "01/02/2024",
      workShift: "Full time",
      employeePosition: "Service staff",
      phoneNumber: "0987654321",
      address: "448 Le Van Viet Street, District 9",
      email: "MDX01234@gmail.com",
      salary: 3900000,
      username: "staff1234",
      password: "123456",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState(""); // Lưu giá trị tìm kiếm
  const [filteredStaff, setFilteredStaff] = useState(staff); // Lưu danh sách món ăn được lọc

  const [showAddForm, setShowAddForm] = useState(false); // Hiển thị form thêm món ăn
  const [newStaff, setNewStaff] = useState({
    id: "",
    fullName: "",
    startDate: "",
    workShift: "",
    employeePosition: "",
    phoneNumber: "",
    address: "",
    email: "",
    salary: "",
    username: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState(""); // Lưu thông báo lỗi
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // Hiển thị popup thành công

  const [showDeletePopup, setShowDeletePopup] = useState(false); // Hiển thị popup xác nhận xóa
  const [staffToDelete, setStaffToDelete] = useState(null); // Món ăn cần xóa

  const [showEditForm, setShowEditForm] = useState(false); // Hiển thị form chỉnh sửa
  const [staffToEdit, setStaffToEdit] = useState(null); // Món ăn cần chỉnh sửa

  const handleDeleteStaff = (Staff) => {
    setStaffToDelete(Staff); // Lưu món ăn cần xóa
    setShowDeletePopup(true); // Hiển thị popup xác nhận
  };

  const confirmDeleteStaff = () => {
    const updatedStaff = staff.filter((staff) => staff.id !== staffToDelete.id); // Xóa món ăn
    setStaff(updatedStaff); // Cập nhật danh sách món ăn
    setFilteredStaff(updatedStaff); // Cập nhật danh sách hiển thị
    setShowDeletePopup(false); // Ẩn popup
    setStaffToDelete(null); // Xóa món ăn khỏi state
  };

  const handleEditStaff = (staff) => {
    setStaffToEdit(staff); // Lưu món ăn cần chỉnh sửa
    setNewStaff(staff); // Điền thông tin cũ vào form
    setShowEditForm(true); // Hiển thị form chỉnh sửa
  };

  const confirmEditStaff = () => {
    // Validate dữ liệu
    if (
      !newStaff.id ||
      !newStaff.fullName ||
      !newStaff.employeePosition ||
      !newStaff.phoneNumber ||
      !newStaff.address ||
      !newStaff.email ||
      !newStaff.salary ||
      !newStaff.username ||
      !newStaff.password
    ) {
      setErrorMessage("All fields are required!");
      return;
    }

    // Cập nhật món ăn
    const updatedStaff = staff.map((staff) =>
      staff.id === staffToEdit.id ? { ...newStaff, id: staffToEdit.id } : staff
    );
    setStaff(updatedStaff); // Cập nhật danh sách món ăn
    setFilteredStaff(updatedStaff); // Cập nhật danh sách hiển thị
    setShowEditForm(false); // Ẩn form
    setStaffToEdit(null); // Xóa món ăn khỏi state
    setNewStaff({
      id: "",
      fullName: "",
      startDate: "",
      workShift: "",
      employeePosition: "",
      phoneNumber: "",
      address: "",
      email: "",
      salary: "",
      username: "",
      password: "",
    }); // Reset form
    setErrorMessage(""); // Xóa thông báo lỗi

    // Hiển thị popup thành công
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 2000); // Ẩn popup sau 2 giây
  };

  const validateAndAddStaff = () => {
    // Kiểm tra dữ liệu nhập
    if (
      !newStaff.fullName ||
      !newStaff.email ||
      !newStaff.workShift ||
      !newStaff.position ||
      !newStaff.phoneNumber ||
      !newStaff.address ||
      !newStaff.salary ||
      !newStaff.username ||
      !newStaff.password
    ) {
      setErrorMessage("All fields are required!");
      return;
    }

    if (isNaN(parseFloat(newStaff.salary))) {
      setErrorMessage("Salary must be a valid number!");
      return;
    }

    // Kiểm tra staff da ton tai
    const isDuplicate = staff.some(
      (staff) =>
        staff.fullName.toLowerCase() === newStaff.fullName.toLowerCase() &&
        staff.id === newStaff.id
    );
    if (isDuplicate) {
      setErrorMessage("Staff already exists!");
      return;
    }

    // Thêm món ăn mới
    const updatedStaff = [
      ...staff,
      { ...newStaff, id: `A${staff.length + 1}` }, // Tạo ID tự động
    ];
    setStaff(updatedStaff); // Cập nhật danh sách món ăn
    setFilteredStaff(updatedStaff); // Cập nhật danh sách hiển thị
    setShowAddForm(false); // Ẩn form
    setNewStaff({
      id: "",
      fullName: "",
      startDate: "",
      workShift: "",
      employeePosition: "",
      phoneNumber: "",
      address: "",
      email: "",
      salary: "",
      username: "",
      password: "",
    }); // Reset form
    setErrorMessage(""); // Xóa thông báo lỗi

    // Hiển thị popup thành công
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 2000); // Ẩn popup sau 2 giây
  };

  const handleAddStaff = () => {
    // Thêm nhan vien mới vào danh sách
    const updatedStaff = [
      ...staff,
      { ...newStaff, id: `A${staff.length + 1}` }, // Tạo ID tự động
    ];
    setFilteredStaff(updatedStaff); // Cập nhật danh sách hiển thị
    setShowAddForm(false); // Ẩn form
    setNewStaff({
      id: "",
      fullName: "",
      startDate: "",
      workShift: "",
      employeePosition: "",
      phoneNumber: "",
      address: "",
      email: "",
      salary: "",
      username: "",
      password: "",
    });
  };

  //Xử lí tìm kiếm
  const handleSearch = (event) => {
    if (event.key === "Enter") {
      if (searchTerm.trim() === "") {
        setFilteredStaff(staff); // Hiển thị toàn bộ danh sách nếu ô tìm kiếm trống
      } else {
        const filtered = staff.filter((Staff) =>
          Staff.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredStaff(filtered); // Cập nhật danh sách món ăn được lọc
      }
    }
  };

  const styles = {
    outerContainer: {
      fontFamily: "Arial, sans-serif",
      backgroundColor: "rgba(157, 198, 206, 0.33)", // Màu #9DC6CE với độ mờ 30%
      minHeight: "auto", // Chiều cao tối thiểu là toàn màn hình
      width: "100vw", // Chiều rộng tối đa là toàn màn hình
      display: "flex",
      justifyContent: "center", // Căn giữa nội dung theo chiều ngang
      alignItems: "center", // Căn giữa nội dung theo chiều dọc
      padding: "30px", // Khoảng cách giữa nội dung và viền ngoài
      boxSizing: "border-box", // Đảm bảo padding không làm tăng kích thước container
    },
    innerContainer: {
      backgroundColor: "#F0F8FD", // Màu nền của innerContainer
      borderRadius: "10px", // Bo góc
      padding: "20px", // Khoảng cách bên trong
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Đổ bóng nhẹ
      border: "3px solid rgba(0, 0, 0, 0.1)", // Viền nhẹ
      width: "100%", // Chiều rộng đầy đủ
      maxWidth: "1200px", // Giới hạn chiều rộng tối đa
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box", // Đảm bảo padding không làm tăng kích thước container
    },
    title: {
      textAlign: "center",
      fontSize: "35px",
      fontWeight: "bold",
      marginBottom: "15px",
    },
    tableAndControls: {
      display: "flex",
      alignItems: "flex-start", // Căn các thành phần theo chiều dọc
      gap: "20px", // Khoảng cách giữa bảng và ô tìm kiếm/nút
      flex: 1, // Khoảng cách giữa bảng và ô tìm kiếm/nút
    },
    searchAndButtonContainer: {
      flex: 1, // Container bên cạnh chiếm ít không gian hơn
      display: "flex",
      flexDirection: "column", // Đặt các thành phần theo chiều dọc
      alignItems: "flex-end", // Căn sang phải
      gap: "10px", // Khoảng cách giữa các thành phần
    },
    searchRow: {
      display: "flex",
      flexDirection: "row", // Đặt ô tìm kiếm và nút trên cùng một hàng
      alignItems: "center", // Căn giữa theo chiều dọc
      gap: "10px", // Khoảng cách giữa ô tìm kiếm và nút
    },
    input: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      width: "200px",
    },
    chefMouseImage: {
      marginTop: "55px", // Khoảng cách giữa hình ảnh và nút
      width: "280px", // Chiều rộng của hình ảnh
      height: "400px", // Tự động điều chỉnh chiều cao theo tỷ lệ
    },
    tableContainer: {
      flex: 3, // Bảng chiếm nhiều không gian hơn
      backgroundColor: "rgba(157, 198, 206, 0.3)", // Nền màu
      borderRadius: "10px",
      overflowY: "auto", // Kích hoạt thanh cuộn dọc
      maxHeight: "500px", // Giới hạn chiều cao của bảng
      width: "100%", // Chiều rộng đầy đủ
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      border: "2px solid #9DC6CE",
    },
    thead: {
      position: "sticky", // Cố định tiêu đề bảng
      padding: "0 0 10px ",
      top: 0, // Cố định ở đầu container
      zIndex: 2, // Đảm bảo tiêu đề nằm trên các thành phần khác
      backgroundColor: "#9DC6CE", // Màu nền tiêu đề
      border: "1px solid rgb(0, 0, 0)", // Viền tiêu đề
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
      backgroundColor: "rgba(157, 198, 206, 0.3)", // Màu #9DC6CE với độ mờ 30%
    },
    evenRow: {
      backgroundColor: "#FFFFFF", // Màu trắng
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.5)", // Làm mờ màn hình
      zIndex: 999, // Đảm bảo lớp phủ nằm trên các thành phần khác
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
      height: "auto", // Chiều cao tự động
      maxHeight: "90vh", // Giới hạn chiều cao tối đa
      overflowY: "auto", // Kích hoạt thanh cuộn dọc nếu nội dung vượt quá chiều cao
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
      gap: "20px", // Khoảng cách giữa 2 cột
    },
    formFields: {
      flex: "1",
      display: "flex",
      flexDirection: "column",
      gap: "15px", // Tăng khoảng cách giữa các hàng để giao diện thoáng hơn
    },
    labelText: {
      width: "150px", // Chiều rộng cố định cho nhãn để căn chỉnh thẳng hàng
      display: "inline-block", // Đảm bảo nhãn có chiều rộng cố định
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
      flex: "0 0 40%", // Chiếm 40% chiều rộng
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      border: "1px solid #ddd", // Viền bao quanh
      borderRadius: "10px", // Bo góc
      padding: "20px", // Khoảng cách bên trong
      backgroundColor: "#f9f9f9", // Màu nền nhạt
    },
    imagePreview: {
      width: "250px", // Tăng kích thước ô hình
      height: "250px",
      border: "1px solid #ddd",
      borderRadius: "10px",
      overflow: "hidden",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff", // Nền trắng cho ô hình
    },
    image: {
      width: "100%",
      height: "100%",
      objectFit: "cover", // Đảm bảo hình ảnh vừa khít
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
      alignItems: "center", // Căn giữa theo chiều dọc
      gap: "10px", // Khoảng cách giữa nhãn và ô input/select
      width: "100%", // Đảm bảo nhãn chiếm toàn bộ chiều rộng
    },
    requiredMark: {
      color: "#e74c3c", // Màu đỏ cho dấu (*)
      marginLeft: "5px",
    },
    inputField: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      fontSize: "14px",
      width: "250px", // Chiều rộng cố định cho ô input
      boxSizing: "border-box", // Đảm bảo padding và border không làm tăng kích thước
    },
    selectField: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      fontSize: "14px",
      width: "250px", // Chiều rộng cố định cho ô select
      boxSizing: "border-box", // Đảm bảo padding và border không làm tăng kích thước
    },
    textareaField: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      fontSize: "14px",
      width: "100%",
      maxWidth: "300px", // Giới hạn chiều rộng tối đa
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
      display: "flex", // Sử dụng Flexbox
      flexDirection: "column", // Căn chỉnh các phần tử theo chiều dọc
      alignItems: "center", // Căn giữa theo chiều ngang
      justifyContent: "center", // Căn giữa theo chiều dọc
    },
    successIcon: {
      fontSize: "24px",
      color: "#4CAF50",
      marginTop: "10px",
    },
    successImage: {
      width: "100px", // Kích thước hình ảnh
      height: "auto", // Tự động điều chỉnh chiều cao theo tỷ lệ
    },
    successText: {
      fontSize: "18px",
      fontWeight: "bold",
      marginBottom: "5px",
    },
    errorText: {
      color: "#e74c3c", // Màu đỏ
      fontSize: "14px",
      marginBottom: "10px", // Khoảng cách bên dưới
      textAlign: "center", // Căn giữa
    },
  };

  return (
    <>
      {/* Thanh menu */}
      <MenuBar
        title="Staff Management"
        icon="https://img.icons8.com/ios-filled/50/FFFFFF/user.png"
      />

      {/* Container ngoài */}
      <div style={styles.outerContainer}>
        {/* Container bên trong */}
        <div style={styles.innerContainer}>
          {/* Tiêu đề */}
          <h1 style={styles.title}>Staff</h1>

          {/* Bảng và ô tìm kiếm/nút */}
          <div style={styles.tableAndControls}>
            {/* Bảng món ăn */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Shift</th>
                    <th style={styles.th}>Position</th>
                    <th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((Staff, index) => (
                    <tr
                      key={Staff.id}
                      style={index % 2 === 0 ? styles.evenRow : styles.oddRow}
                    >
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          {Staff.id}
                        </div>
                      </td>
                      <td style={styles.td}>{Staff.fullName}</td>
                      <td style={{ ...styles.td, ...styles.price }}>
                        {Staff.workShift}
                      </td>
                      <td style={styles.td}>{Staff.employeePosition}</td>

                      {/* Hiển thị Description */}
                      <td style={styles.td}>
                        <button
                          style={{ marginRight: "10px", cursor: "pointer" }}
                          onClick={() => handleEditStaff(Staff)} // Chỉnh sửa món ăn
                        >
                          ✏️
                        </button>
                        <button
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDeleteStaff(Staff)} // Xóa món ăn
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ô tìm kiếm, nút "+" và hình ảnh */}
            <div style={styles.searchAndButtonContainer}>
              {/* Hàng chứa ô tìm kiếm và nút */}
              <div style={styles.searchRow}>
                <input
                  type="text"
                  placeholder="Search..."
                  style={styles.input}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} // Cập nhật giá trị tìm kiếm
                  onKeyDown={handleSearch} // Lắng nghe sự kiện nhấn phím Enter
                />
                <button
                  style={styles.addButton}
                  onClick={() => setShowAddForm(true)} // Hiển thị form khi nhấn nút
                >
                  +
                </button>
              </div>
              {/* Hình ảnh Chef Mouse */}
              <img
                src="./src/assets/img/chef.png"
                alt="Chef"
                style={styles.chefMouseImage}
              />
            </div>
          </div>

          {showAddForm && (
            <>
              {/* Lớp phủ làm mờ màn hình */}
              <div
                style={styles.overlay}
                onClick={() => setShowAddForm(false)}
              ></div>

              {/* Modal thêm nhân viên */}
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Add staff</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    {/* Cột bên trái: Chọn ảnh */}
                    <div style={styles.imageUploadSection}>
                      <label style={styles.imageUploadContainer}>
                        <div style={styles.imagePreview}>
                          {newStaff.image ? (
                            <img
                              src={newStaff.image}
                              alt="Review staff"
                              style={styles.image}
                            />
                          ) : (
                            <div style={styles.placeholderText}>
                              Select images in the formats (.jpg, .jpeg, .png,
                              .gif)
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          style={styles.fileInput}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              image: URL.createObjectURL(e.target.files[0]),
                            })
                          }
                        />
                      </label>
                      <p style={styles.imageNote}>
                        Select images in the formats (
                        <b>.jpg, .jpeg, .png, .gif</b>)
                      </p>
                    </div>

                    {/* Cột bên phải: Các trường nhập liệu */}
                    <div style={styles.formFields}>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Full name <span style={styles.requiredMark}>(*)</span>
                          :
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
                          Start date of work{" "}
                          <span style={styles.requiredMark}>(*)</span>:
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
                          Work shift{" "}
                          <span style={styles.requiredMark}>(*)</span>:
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
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                        </select>
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Position <span style={styles.requiredMark}>(*)</span>:
                        </span>
                        <input
                          type="text"
                          value={newStaff.employeePosition}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              employeePosition: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Phone number{" "}
                          <span style={styles.requiredMark}>(*)</span>:
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
                          Address <span style={styles.requiredMark}>(*)</span>:
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
                          Salary <span style={styles.requiredMark}>(*)</span>:
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
                          Username <span style={styles.requiredMark}>(*)</span>:
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
                          Password <span style={styles.requiredMark}>(*)</span>:
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

                  {/* Nút hành động */}
                  <div style={styles.actionButtons}>
                    <button
                      onClick={validateAndAddStaff}
                      style={styles.addButton}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Popup thêm thành công */}
          {showSuccessPopup && (
            <div style={styles.successPopup}>
              <img
                src={logoRemoveBg}
                alt="Bon Appétit"
                style={styles.successImage} // Thêm style riêng cho hình ảnh
              />
              <p>
                <b>Successful</b>
              </p>
              <div style={styles.successIcon}>✔</div>
            </div>
          )}

          {/* Popup xóa dữ liệu*/}
          {showDeletePopup && (
            <div style={styles.successPopup}>
              <img
                src={logoRemoveBg}
                alt="Bon Appétit"
                style={styles.successImage} // Thêm style riêng cho hình ảnh
              />
              <p>
                <b>Are you sure?</b>
              </p>
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

          {showEditForm && (
            <>
              {/* Lớp phủ làm mờ màn hình */}
              <div
                style={styles.overlay}
                onClick={() => setShowEditForm(false)} // Đóng modal khi nhấn vào lớp phủ
              ></div>

              {/* Modal chỉnh sửa nhân viên */}
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Sửa Nhân Viên</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    {/* Cột bên trái: Chọn ảnh */}
                    <div style={styles.imageUploadSection}>
                      <label style={styles.imageUploadContainer}>
                        <div style={styles.imagePreview}>
                          {newStaff.image ? (
                            <img
                              src={newStaff.image}
                              alt="Review staffstaff"
                              style={styles.image}
                            />
                          ) : (
                            <div style={styles.placeholderText}>
                              Select images in the formats (.jpg, .jpeg, .png, .gif)
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          style={styles.fileInput}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              image: URL.createObjectURL(e.target.files[0]),
                            })
                          }
                        />
                      </label>
                      <p style={styles.imageNote}>
                      Select images in the formats (<b>.jpg, .jpeg, .png, .gif</b>)
                      </p>
                    </div>

                    {/* Cột bên phải: Các trường nhập liệu */}
                    <div style={styles.formFields}>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Full name <span style={styles.requiredMark}>(*)</span>
                          :
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
                          Start date of work{" "}
                          <span style={styles.requiredMark}>(*)</span>:
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
                          Work shift{" "}
                          <span style={styles.requiredMark}>(*)</span>:
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
                          <option value="Full-time">Toàn thời gian</option>
                          <option value="Part-time">Bán thời gian</option>
                        </select>
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Position <span style={styles.requiredMark}>(*)</span>:
                        </span>
                        <input
                          type="text"
                          value={newStaff.employeePosition}
                          onChange={(e) =>
                            setNewStaff({
                              ...newStaff,
                              employeePosition: e.target.value,
                            })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        <span style={styles.labelText}>
                          Phone number{" "}
                          <span style={styles.requiredMark}>(*)</span>:
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
                          Address <span style={styles.requiredMark}>(*)</span>:
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
                          Salary <span style={styles.requiredMark}>(*)</span>:
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
                          Username{" "}
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
                          Password <span style={styles.requiredMark}>(*)</span>:
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
                    <p style={styles.errorText}>{errorMessage}</p> // Hiển thị lỗi nếu có
                  )}

                  {/* Nút hành động */}
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
        </div>
      </div>
    </>
  );
};

export default StaffManagementAdmin;
