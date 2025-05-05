import React, { useState, useEffect } from "react";
import axios from "axios";
import MenuBar from "../../../components/layout/MenuBar";
import logoRemoveBg from "../../../assets/img/logoremovebg.png";

// Cấu hình Axios
const API_BASE_URL = "http://localhost:8080";
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const MenuManagementAdmin = () => {
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDishes, setFilteredDishes] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDish, setNewDish] = useState({
    name: "",
    price: "",
    category: "Appetizers",
    description: "",
    image: null,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [dishToDelete, setDishToDelete] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [dishToEdit, setDishToEdit] = useState(null);

  // Kiểm tra quyền ADMIN khi component mount
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType !== "ADMIN") {
      setErrorMessage("Bạn cần quyền ADMIN để truy cập trang này.");
      return;
    }
    fetchDishes();
    fetchCategories();
  }, []);

  const fetchDishes = async () => {
    try {
      const response = await api.get("/api/dishes");
      setDishes(response.data);
      setFilteredDishes(response.data);
    } catch (error) {
      console.error("Error fetching dishes:", error.response?.data);
      let errorMessage = "Không thể tải danh sách món ăn. Vui lòng thử lại.";
      if (error.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      } else if (error.response?.status === 403) {
        errorMessage = "Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản ADMIN.";
      }
      setErrorMessage(errorMessage);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error.response?.data);
      let errorMessage = "Không thể tải danh sách danh mục. Vui lòng thử lại.";
      if (error.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      } else if (error.response?.status === 403) {
        errorMessage = "Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản ADMIN.";
      }
      setErrorMessage(errorMessage);
    }
  };

  // Handle search in frontend
  const handleSearch = (event) => {
    if (event.key === "Enter") {
      if (searchTerm.trim() === "") {
        setFilteredDishes(dishes);
      } else {
        const filtered = dishes.filter((dish) =>
          dish.dishName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredDishes(filtered);
      }
    }
  };

  // Add new dish
  const validateAndAddDish = async () => {
    if (!newDish.name || !newDish.price || !newDish.description || !newDish.image) {
      setErrorMessage("Tất cả các trường là bắt buộc!");
      return;
    }

    if (isNaN(parseFloat(newDish.price))) {
      setErrorMessage("Giá phải là số hợp lệ!");
      return;
    }

    if (newDish.name.length > 100) {
      setErrorMessage("Tên món ăn phải dưới 100 ký tự!");
      return;
    }

    const isDuplicate = dishes.some(
      (dish) => dish.dishName.toLowerCase() === newDish.name.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage("Tên món ăn đã tồn tại!");
      return;
    }

    const category = categories.find((cat) => cat.name === newDish.category);
    if (!category) {
      setErrorMessage("Danh mục không hợp lệ!");
      return;
    }

    const formData = new FormData();
    formData.append("name", newDish.name);
    formData.append("price", parseFloat(newDish.price));
    formData.append("categoryId", category.id);
    formData.append("description", newDish.description);
    formData.append("image", newDish.image);
    formData.append("status", newDish.status?.toUpperCase() || "AVAILABLE");

    try {
      await api.post("/api/admin/dishes", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setShowAddForm(false);
      setNewDish({
        name: "",
        price: "",
        category: "Appetizers",
        description: "",
        image: null,
      });
      setErrorMessage("");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
      fetchDishes();
    } catch (error) {
      console.error("Error adding dish:", error.response?.data);
      let errorMessage = "Không thể thêm món ăn. Vui lòng thử lại.";
      if (error.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      } else if (error.response?.status === 403) {
        errorMessage = "Bạn không có quyền thêm món ăn. Vui lòng đăng nhập với tài khoản ADMIN.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Dữ liệu đầu vào không hợp lệ.";
      }
      setErrorMessage(errorMessage);
    }
  };

  // Edit dish
  const handleEditDish = (dish) => {
    setDishToEdit(dish);
    setNewDish({
      name: dish.dishName,
      price: dish.price,
      category: dish.categoryName,
      description: dish.description || "",
      image: null,
    });
    setShowEditForm(true);
  };

  const confirmEditDish = async () => {
    if (!newDish.name || !newDish.price || !newDish.description) {
      setErrorMessage("Tên, giá và mô tả là bắt buộc!");
      return;
    }

    if (isNaN(parseFloat(newDish.price))) {
      setErrorMessage("Giá phải là số hợp lệ!");
      return;
    }

    if (newDish.name.length > 100) {
      setErrorMessage("Tên món ăn phải dưới 100 ký tự!");
      return;
    }

    const category = categories.find((cat) => cat.name === newDish.category);
    if (!category) {
      setErrorMessage("Danh mục không hợp lệ!");
      return;
    }

    const formData = new FormData();
    formData.append("name", newDish.name);
    formData.append("price", parseFloat(newDish.price));
    formData.append("categoryId", category.id);
    formData.append("description", newDish.description);
    formData.append("status", "AVAILABLE");
    if (newDish.image) {
      formData.append("image", newDish.image);
      console.log("Image file:", newDish.image.name, newDish.image.type, newDish.image.size);
    } else {
      console.log("No new image provided, using existing image (if any).");
    }

    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    try {
      const response = await api.post(`/api/admin/dishes/${dishToEdit.dishId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Update response:", response.data);
      setShowEditForm(false);
      setNewDish({
        name: "",
        price: "",
        category: "Appetizers",
        description: "",
        image: null,
      });
      setDishToEdit(null);
      setErrorMessage("");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
      fetchDishes();
    } catch (error) {
      console.error("Full error response:", error.response?.data);
      let errorMessage = "Không thể cập nhật món ăn. Vui lòng thử lại.";
      if (error.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      } else if (error.response?.status === 403) {
        errorMessage = "Bạn không có quyền cập nhật món ăn. Vui lòng đăng nhập với tài khoản ADMIN.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Dữ liệu đầu vào không hợp lệ.";
      }
      setErrorMessage(errorMessage);
    }
  };

  // Delete dish
  const confirmDeleteDish = async () => {
    try {
      await api.delete(`/api/dishes/${dishToDelete.dishId}`);
      setShowDeletePopup(false);
      setDishToDelete(null);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
      fetchDishes();
    } catch (error) {
      console.error("Error deleting dish:", error.response?.data);
      let errorMessage = "Không thể xóa món ăn. Vui lòng thử lại.";
      if (error.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      } else if (error.response?.status === 403) {
        errorMessage = "Bạn không có quyền xóa món ăn. Vui lòng đăng nhập với tài khoản ADMIN.";
      }
      setErrorMessage(errorMessage);
    }
  };

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
      fontSize: "24px",
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
      width: "650px",
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
      gap: "5px",
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
      width: "100%",
      maxWidth: "300px",
    },
    selectField: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      fontSize: "14px",
      width: "100%",
      maxWidth: "300px",
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
    errorContainer: {
      textAlign: "center",
      padding: "20px",
      color: "#e74c3c",
      fontSize: "16px",
      fontWeight: "bold",
    },
    actionButtonContainer: {
      display: "flex",
      flexDirection: "row", // sắp xếp theo chiều ngang
      justifyContent: "center",
      gap: "10px", // khoảng cách giữa các nút
    },
    actionButton: {
      padding: "6px 12px",
      fontSize: "16px",
      border: "1px solid #9DC6CE",
      borderRadius: "5px",
      backgroundColor: "#fff",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    editButton: {
      color: "#4CAF50",
    },
    deleteButton: {
      color: "#e74c3c",
    },
  };

  // Nếu không có quyền ADMIN, chỉ hiển thị thông báo lỗi
  if (errorMessage && errorMessage.includes("Bạn cần quyền ADMIN")) {
    return (
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          <div style={styles.errorContainer}>{errorMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MenuBar title="Menu Management" />
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          <h1 style={styles.title}>Menu</h1>
          {errorMessage && (
            <div style={styles.errorContainer}>{errorMessage}</div>
          )}
          <div style={styles.tableAndControls}>
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
                  {filteredDishes.map((dish, index) => (
                    <tr
                      key={dish.dishId}
                      style={index % 2 === 0 ? styles.evenRow : styles.oddRow}
                    >
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <img
                            src={dish.imageUrl || "./src/assets/img/placeholder.jpg"}
                            alt={dish.dishName}
                            style={{
                              width: "50px",
                              height: "50px",
                              borderRadius: "5px",
                              marginRight: "10px",
                            }}
                          />
                          {dish.dishName}
                        </div>
                      </td>
                      <td style={styles.td}>{dish.dishId}</td>
                      <td style={{ ...styles.td, ...styles.price }}>${dish.price}</td>
                      <td style={styles.td}>{dish.categoryName}</td>
                      <td style={styles.td}>{dish.description || "No description"}</td>
                      <td style={styles.td}>
                        <div style={styles.actionButtonContainer}>
                          <button
                            style={{ ...styles.actionButton, ...styles.editButton }}
                            onClick={() => handleEditDish(dish)}
                          >
                            ✏️
                          </button>
                          <button
                            style={{ ...styles.actionButton, ...styles.deleteButton }}
                            onClick={() => handleDeleteDish(dish)}
                          >
                            🗑️
                          </button>
                        </div>
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
                  placeholder="Search..."
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
                src="./src/assets/img/chefmouse.png"
                alt="Chef Mouse"
                style={styles.chefMouseImage}
              />
            </div>
          </div>

          {showAddForm && (
            <>
              <div style={styles.overlay} onClick={() => setShowAddForm(false)}></div>
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Add Dish</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    <div style={styles.imageUploadSection}>
                      <label style={styles.imageUploadContainer}>
                        <div style={styles.imagePreview}>
                          {newDish.image ? (
                            <img
                              src={URL.createObjectURL(newDish.image)}
                              alt="Dish Preview"
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
                            setNewDish({ ...newDish, image: e.target.files[0] })
                          }
                        />
                      </label>
                      <p style={styles.imageNote}>
                        Select images in the formats (.jpg, .jpeg, .png, .gif)
                      </p>
                    </div>
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
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label style={styles.formLabel}>
                        Description <span style={styles.requiredMark}>(*)</span>:
                        <textarea
                          value={newDish.description}
                          onChange={(e) =>
                            setNewDish({ ...newDish, description: e.target.value })
                          }
                          style={styles.textareaField}
                        />
                      </label>
                    </div>
                  </div>
                  {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}
                  <div style={styles.actionButtons}>
                    <button onClick={validateAndAddDish} style={styles.addButton}>
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

          {showEditForm && (
            <>
              <div style={styles.overlay} onClick={() => setShowEditForm(false)}></div>
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Edit Dish</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    <div style={styles.imageUploadSection}>
                      <label style={styles.imageUploadContainer}>
                        <div style={styles.imagePreview}>
                          {newDish.image ? (
                            <img
                              src={URL.createObjectURL(newDish.image)}
                              alt="Dish Preview"
                              style={styles.image}
                            />
                          ) : dishToEdit.imageUrl ? (
                            <img
                              src={dishToEdit.imageUrl}
                              alt="Dish Preview"
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
                            setNewDish({ ...newDish, image: e.target.files[0] })
                          }
                        />
                      </label>
                      <p style={styles.imageNote}>
                        Select images in the formats (.jpg, .jpeg, .png, .gif)
                      </p>
                    </div>
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
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label style={styles.formLabel}>
                        Description <span style={styles.requiredMark}>(*)</span>:
                        <textarea
                          value={newDish.description}
                          onChange={(e) =>
                            setNewDish({ ...newDish, description: e.target.value })
                          }
                          style={styles.textareaField}
                        />
                      </label>
                    </div>
                  </div>
                  {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}
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

          {showSuccessPopup && (
            <div style={styles.successPopup}>
              <img src={logoRemoveBg} alt="Bon Appétit" style={styles.successImage} />
              <p>
                <b>Successful</b>
              </p>
              <div style={styles.successIcon}>✔</div>
            </div>
          )}

          {showDeletePopup && (
            <div style={styles.successPopup}>
              <img src={logoRemoveBg} alt="Bon Appétit" style={styles.successImage} />
              <p>
                <b>Are you sure?</b>
              </p>
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
        </div>
      </div>
    </>
  );
};

export default MenuManagementAdmin;