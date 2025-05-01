import React from "react";
import { useState } from "react";
import MenuBar from "../../../components/layout/menuBar";
import logoRemoveBg from "../../../assets/img/logoremovebg.png";

const MenuManagementAdmin = () => {
  const [Staff, setStaff] = useState([
    {
      id: "A1",
      name: "Huitres Fraiches (6PSC)",
      price: "$25,35",
      category: "Appetizers",
      image: "huitres1.jpg",
    },
    {
      id: "A2",
      name: "Huitres Gratinees (6PCS)",
      price: "$25,74",
      category: "Appetizers",
      image: "huitres2.jpg",
    },
    {
      id: "A3",
      name: "Tartare De Saumon",
      price: "$14,04",
      category: "Appetizers",
      image: "tartare.jpg",
    },
    {
      id: "A4",
      name: "Salad Gourmande",
      price: "$13,65",
      category: "Appetizers",
      image: "salad1.jpg",
    },
    {
      id: "A5",
      name: "Salad Landaise",
      price: "$12,29",
      category: "Appetizers",
      image: "salad2.jpg",
    },
    {
      id: "M1",
      name: "Magret De Canard",
      price: "$17,55",
      category: "Main",
      image: "magret.jpg",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState(""); // Lưu giá trị tìm kiếm
  const [filteredStaff, setFilteredStaff] = useState(Staff); // Lưu danh sách món ăn được lọc

  const [showAddForm, setShowAddForm] = useState(false); // Hiển thị form thêm món ăn
  const [newDish, setNewDish] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    image: "",
  });

  const [errorMessage, setErrorMessage] = useState(""); // Lưu thông báo lỗi
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // Hiển thị popup thành công

  const [showDeletePopup, setShowDeletePopup] = useState(false); // Hiển thị popup xác nhận xóa
  const [dishToDelete, setDishToDelete] = useState(null); // Món ăn cần xóa

  const [showEditForm, setShowEditForm] = useState(false); // Hiển thị form chỉnh sửa
  const [dishToEdit, setDishToEdit] = useState(null); // Món ăn cần chỉnh sửa

  const handleDeleteDish = (dish) => {
    setDishToDelete(dish); // Lưu món ăn cần xóa
    setShowDeletePopup(true); // Hiển thị popup xác nhận
  };

  const confirmDeleteDish = () => {
    const updatedStaff = Staff.filter((dish) => dish.id !== dishToDelete.id); // Xóa món ăn
    setStaff(updatedStaff); // Cập nhật danh sách món ăn
    setFilteredStaff(updatedStaff); // Cập nhật danh sách hiển thị
    setShowDeletePopup(false); // Ẩn popup
    setDishToDelete(null); // Xóa món ăn khỏi state
  };

  const handleEditDish = (dish) => {
    setDishToEdit(dish); // Lưu món ăn cần chỉnh sửa
    setNewDish(dish); // Điền thông tin cũ vào form
    setShowEditForm(true); // Hiển thị form chỉnh sửa
  };

  const confirmEditDish = () => {
    // Validate dữ liệu
    if (!newDish.name || !newDish.price || !newDish.description) {
      setErrorMessage("All fields are required!");
      return;
    }
  
    if (isNaN(parseFloat(newDish.price.replace("$", "")))) {
      setErrorMessage("Price must be a valid number!");
      return;
    }
  
    // Cập nhật món ăn
    const updatedStaff = Staff.map((dish) =>
      dish.id === dishToEdit.id ? { ...newDish, id: dishToEdit.id } : dish
    );
    setStaff(updatedStaff); // Cập nhật danh sách món ăn
    setFilteredStaff(updatedStaff); // Cập nhật danh sách hiển thị
    setShowEditForm(false); // Ẩn form
    setDishToEdit(null); // Xóa món ăn khỏi state
    setNewDish({
      name: "",
      price: "",
      category: "Appetizers",
      description: "",
      image: "",
    }); // Reset form
    setErrorMessage(""); // Xóa thông báo lỗi
  
    // Hiển thị popup thành công
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 2000); // Ẩn popup sau 2 giây
  };

  const validateAndAddDish = () => {
    // Kiểm tra dữ liệu nhập
    if (!newDish.name || !newDish.price || !newDish.description) {
      setErrorMessage("All fields are required!");
      return;
    }

    if (isNaN(parseFloat(newDish.price))) {
      setErrorMessage("Price must be a valid number!");
      return;
    }

    // Kiểm tra tên món ăn đã tồn tại
    const isDuplicate = Staff.some(
      (dish) => dish.name.toLowerCase() === newDish.name.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage("Dish name already exists!");
      return;
    }

    // Thêm món ăn mới
    const updatedStaff = [
      ...Staff,
      { ...newDish, id: `A${Staff.length + 1}` }, // Tạo ID tự động
    ];
    setStaff(updatedStaff); // Cập nhật danh sách món ăn
    setFilteredStaff(updatedStaff); // Cập nhật danh sách hiển thị
    setShowAddForm(false); // Ẩn form
    setNewDish({
      name: "",
      price: "",
      category: "Appetizers",
      description: "",
      image: "",
    }); // Reset form
    setErrorMessage(""); // Xóa thông báo lỗi

    // Hiển thị popup thành công
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 2000); // Ẩn popup sau 2 giây
  };

  const handleAddDish = () => {
    // Thêm món ăn mới vào danh sách
    const updatedStaff = [
      ...Staff,
      { ...newDish, id: `A${Staff.length + 1}` }, // Tạo ID tự động
    ];
    setFilteredStaff(updatedStaff); // Cập nhật danh sách hiển thị
    setShowAddForm(false); // Ẩn form
    setNewDish({
      name: "",
      price: "",
      category: "Appetizers",
      description: "",
      image: "",
    }); // Reset form
  };
  

  //Xử lí tìm kiếmkiếm
  const handleSearch = (event) => {
    if (event.key === "Enter") {
      if (searchTerm.trim() === "") {
        setFilteredStaff(Staff); // Hiển thị toàn bộ danh sách nếu ô tìm kiếm trống
      } else {
        const filtered = Staff.filter((dish) =>
          dish.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      width: "650px",
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
      gap: "10px",
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
      gap: "5px", // Khoảng cách giữa nhãn và trường nhập liệu
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
      width: "100%",
      maxWidth: "300px", // Giới hạn chiều rộng tối đa
    },
    selectField: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      fontSize: "14px",
      width: "100%",
      maxWidth: "300px", // Giới hạn chiều rộng tối đa
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
      <MenuBar title="Menu Management" />

      {/* Container ngoài */}
      <div style={styles.outerContainer}>
        {/* Container bên trong */}
        <div style={styles.innerContainer}>
          {/* Tiêu đề */}
          <h1 style={styles.title}>Menu</h1>

          {/* Bảng và ô tìm kiếm/nút */}
          <div style={styles.tableAndControls}>
            {/* Bảng món ăn */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead style={styles.thead}>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((dish, index) => (
                    <tr
                      key={dish.id}
                      style={index % 2 === 0 ? styles.evenRow : styles.oddRow}
                    >
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <img
                            src={`./src/assets/img/${dish.image}`}
                            alt={dish.name}
                            style={{
                              width: "50px",
                              height: "50px",
                              borderRadius: "5px",
                              marginRight: "10px",
                            }}
                          />
                          {dish.name}
                        </div>
                      </td>
                      <td style={styles.td}>{dish.id}</td>
                      <td style={{ ...styles.td, ...styles.price }}>
                        {dish.price}
                      </td>
                      <td style={styles.td}>{dish.category}</td>
                      <td style={styles.td}>
                        {dish.description || "No description"}
                      </td>{" "}
                      {/* Hiển thị Description */}
                      <td style={styles.td}>
                        <button
                          style={{ marginRight: "10px", cursor: "pointer" }}
                          onClick={() => handleEditDish(dish)} // Chỉnh sửa món ăn
                        >
                          ✏️
                        </button>
                        <button
                          style={{ cursor: "pointer" }}
                          onClick={() => handleDeleteDish(dish)} // Xóa món ăn
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
                src="./src/assets/img/chefmouse.png"
                alt="Chef Mouse"
                style={styles.chefMouseImage}
              />
            </div>
          </div>

          {showAddForm && (
            <>
              {/* Lớp phủ làm mờ màn hình */}
              <div
                style={styles.overlay}
                onClick={() => setShowAddForm(false)} // Đóng modal khi nhấn vào lớp phủ
              ></div>

              {/* Modal thêm món ăn */}
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Add Dish</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    {/* Cột bên trái: Chọn ảnh */}
                    <div style={styles.imageUploadSection}>
                      <label style={styles.imageUploadContainer}>
                        <div style={styles.imagePreview}>
                          {newDish.image ? (
                            <img
                              src={newDish.image}
                              alt="Dish Preview"
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
                            setNewDish({
                              ...newDish,
                              image: URL.createObjectURL(e.target.files[0]),
                            })
                          }
                        />
                      </label>
                      <p style={styles.imageNote}>
                        Select images in the formats (.jpg, .jpeg, .png, .gif)
                      </p>
                    </div>

                    {/* Cột bên phải: Các trường nhập liệu */}
                    <div style={styles.formFields}>
                      <label style={styles.formLabel}>
                        Name <span style={styles.requiredMark}>(*)</span>:
                        <input
                          type="text"
                          value={newDish.name}
                          onChange={(e) =>
                            setNewDish({ ...newDish, name: e.target.value })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        Price <span style={styles.requiredMark}>(*)</span>:
                        <input
                          type="text"
                          value={newDish.price}
                          onChange={(e) =>
                            setNewDish({ ...newDish, price: e.target.value })
                          }
                          style={styles.inputField}
                        />
                      </label>
                      <label style={styles.formLabel}>
                        Category <span style={styles.requiredMark}>(*)</span>:
                        <select
                          value={newDish.category}
                          onChange={(e) =>
                            setNewDish({ ...newDish, category: e.target.value })
                          }
                          style={styles.selectField}
                        >
                          <option value="Appetizers">Appetizers</option>
                          <option value="Main">Main</option>
                          <option value="Desserts">Desserts</option>
                        </select>
                      </label>
                      <label style={styles.formLabel}>
                        Description <span style={styles.requiredMark}>(*)</span>
                        :
                        <textarea
                          value={newDish.description}
                          onChange={(e) =>
                            setNewDish({
                              ...newDish,
                              description: e.target.value,
                            })
                          }
                          style={styles.textareaField}
                        />
                      </label>
                    </div>
                  </div>

                  {errorMessage && (
                    <p style={styles.errorText}>{errorMessage}</p> // Hiển thị lỗi nếu có
                  )}

                  {/* Nút hành động */}
                  <div style={styles.actionButtons}>
                    <button
                      onClick={validateAndAddDish}
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
              <p><b>Are you sure?</b></p>
              <div style={styles.actionButtons}>
                <button onClick={confirmDeleteDish} style={styles.addButton}>
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
              <div
                style={styles.overlay}
                onClick={() => setShowEditForm(false)} // Đóng modal khi nhấn vào lớp phủ
              ></div>
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Edit Dish</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    {/* Cột bên trái: Chọn ảnh */}
                    <div style={styles.imageUploadSection}>
                      <label style={styles.imageUploadContainer}>
                        <div style={styles.imagePreview}>
                          {newDish.image ? (
                            <img
                              src={newDish.image}
                              alt="Dish Preview"
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
                            setNewDish({
                              ...newDish,
                              image: URL.createObjectURL(e.target.files[0]),
                            })
                          }
                        />
                      </label>
                      <p style={styles.imageNote}>
                        Select images in the formats (.jpg, .jpeg, .png, .gif)
                      </p>
                    </div>

                    {/* Cột bên phải: Các trường nhập liệu */}
                    <div style={styles.formFields}>
                      <label style={styles.formLabel}>
                        Name <span style={styles.requiredMark}>(*)</span>:
                        <input
                          type="text"
                          value={newDish.name}
                          onChange={(e) =>
                            setNewDish({ ...newDish, name: e.target.value })
                          }
                          style={styles.inputField}
                          placeholder={dishToEdit?.name} // Hiển thị thông tin cũ
                        />
                      </label>
                      <label style={styles.formLabel}>
                        Price <span style={styles.requiredMark}>(*)</span>:
                        <input
                          type="text"
                          value={newDish.price}
                          onChange={(e) =>
                            setNewDish({ ...newDish, price: e.target.value })
                          }
                          style={styles.inputField}
                          placeholder={dishToEdit?.price} // Hiển thị thông tin cũ
                        />
                      </label>
                      <label style={styles.formLabel}>
                        Category <span style={styles.requiredMark}>(*)</span>:
                        <select
                          value={newDish.category}
                          onChange={(e) =>
                            setNewDish({ ...newDish, category: e.target.value })
                          }
                          style={styles.selectField}
                        >
                          <option value="Appetizers">Appetizers</option>
                          <option value="Main">Main</option>
                          <option value="Desserts">Desserts</option>
                        </select>
                      </label>
                      <label style={styles.formLabel}>
                        Description <span style={styles.requiredMark}>(*)</span>
                        :
                        <textarea
                          value={newDish.description}
                          onChange={(e) =>
                            setNewDish({
                              ...newDish,
                              description: e.target.value,
                            })
                          }
                          style={styles.textareaField}
                          placeholder={dishToEdit?.description} // Hiển thị thông tin cũ
                        />
                      </label>
                    </div>
                  </div>

                  {errorMessage && (
                    <p style={styles.errorText}>{errorMessage}</p> // Hiển thị lỗi nếu có
                  )}

                  {/* Nút hành động */}
                  <div style={styles.actionButtons}>
                    <button onClick={confirmEditDish} style={styles.addButton}>
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

export default MenuManagementAdmin;
