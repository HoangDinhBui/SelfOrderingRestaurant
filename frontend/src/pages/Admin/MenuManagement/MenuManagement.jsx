import React, { useState, useEffect } from "react";
import axios from "axios";
import MenuBar from "../../../components/layout/MenuBar";

import { BACKEND_URL } from "../../../config";
// Cấu hình Axios
const API_BASE_URL = BACKEND_URL;
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
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
  const [hasAdminAccess, setHasAdminAccess] = useState(true);

  useEffect(() => {
    const userType = localStorage.getItem("userType");
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp < currentTime) {
          setErrorMessage("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          setHasAdminAccess(false);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userType");
          window.location.href = "/login";
          return;
        }
      } catch (e) {
        console.error("Error decoding token:", e);
        setErrorMessage("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        setHasAdminAccess(false);
        return;
      }
    }

    if (!userType || userType.toUpperCase() !== "ADMIN") {
      setHasAdminAccess(false);
      setErrorMessage(
        "Không có quyền truy cập: trang này dành cho quản trị viên."
      );
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
      handleApiError(error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error.response?.data);
      handleApiError(error);
    }
  };

  const handleApiError = (error) => {
    let errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
    if (error.response) {
      console.error("API Error:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
      if (error.response.status === 401) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userType");
        window.location.href = "/login";
      } else if (error.response.status === 403) {
        errorMessage = "Access Denied: You need ADMIN privileges.";
        setHasAdminAccess(false);
      } else if (error.response.status === 500) {
        errorMessage =
          error.response.data.message ||
          "Lỗi máy chủ. Vui lòng thử lại.";
      } else {
        errorMessage = error.response.data?.message || errorMessage;
      }
    } else {
      console.error("Network Error:", error.message);
    }
    setErrorMessage(errorMessage);
  };

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

  const validateAndAddDish = async () => {
    if (
      !newDish.name ||
      !newDish.price ||
      !newDish.description ||
      !newDish.image
    ) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (isNaN(parseFloat(newDish.price))) {
      setErrorMessage("Giá phải là số hợp lệ!");
      return;
    }

    if (newDish.name.length > 100) {
      setErrorMessage("Tên món phải dưới 100 ký tự!");
      return;
    }

    const isDuplicate = dishes.some(
      (dish) => dish.dishName.toLowerCase() === newDish.name.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage("Tên món đã tồn tại!");
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
    formData.append("status", "AVAILABLE");

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
      handleApiError(error);
    }
  };

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
      setErrorMessage("Vui lòng nhập tên, giá và mô tả!");
      return;
    }

    if (isNaN(parseFloat(newDish.price))) {
      setErrorMessage("Giá phải là số hợp lệ!");
      return;
    }

    if (newDish.name.length > 100) {
      setErrorMessage("Tên món phải dưới 100 ký tự!");
      return;
    }

    const category = categories.find((cat) => cat.name === newDish.category);
    if (!category || !category.id) {
      setErrorMessage("Vui lòng chọn danh mục hợp lệ!");
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
    }

    try {
      const response = await api.post(
        `/api/admin/dishes/${dishToEdit.dishId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
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
      console.error("Error updating dish:", error.response?.data);
      handleApiError(error);
    }
  };

  const handleDeleteDish = (dish) => {
    setDishToDelete(dish);
    setShowDeletePopup(true);
  };

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
      handleApiError(error);
    }
  };

  const styles = {
    outerContainer: {
      fontFamily: "inherit",
      backgroundColor: "#FAF7F2",
      minHeight: "calc(100vh - 64px)",
      width: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "24px 16px",
      boxSizing: "border-box",
    },
    innerContainer: {
      backgroundColor: "#FFFDF8",
      borderRadius: "16px",
      padding: "24px",
      boxShadow: "0 1px 3px rgba(51, 38, 29, 0.08)",
      border: "1px solid #EADBC8",
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
      borderRadius: "10px",
      border: "1px solid #EADBC8",
      minHeight: "40px",
      width: "200px",
    },
    chefMouseImage: {
      marginTop: "55px",
      width: "280px",
      height: "400px",
    },
    tableContainer: {
      flex: 3,
      backgroundColor: "#F6EEE3",
      borderRadius: "10px",
      overflowY: "auto",
      maxHeight: "500px",
      width: "100%",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      border: "2px solid #EADBC8",
    },
    thead: {
      position: "sticky",
      padding: "0 0 10px ",
      top: 0,
      zIndex: 2,
      backgroundColor: "#F3E4D2",
      border: "1px solid rgb(0, 0, 0)",
    },
    th: {
      backgroundColor: "#F3E4D2",
      fontWeight: "bold",
      border: "1px solid #dddddd",
      padding: "10px",
      textAlign: "center",
    },
    td: {
      border: "1px solid #EADBC8",
      padding: "10px",
      textAlign: "center",
    },
    price: {
      color: "#C2410C",
      fontWeight: "bold",
    },
    oddRow: {
      backgroundColor: "#F6EEE3",
    },
    evenRow: {
      backgroundColor: "#FFFFFF",
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
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
      backgroundColor: "#C2410C",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontWeight: 600,
      minHeight: "40px",
      cursor: "pointer",
    },
    cancelButton: {
      padding: "10px 20px",
      backgroundColor: "#FFFFFF",
      color: "#33261D",
      border: "1px solid #EADBC8",
      borderRadius: "10px",
      fontWeight: 600,
      minHeight: "40px",
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
      color: "#C2410C",
      marginLeft: "5px",
    },
    inputField: {
      padding: "10px",
      borderRadius: "10px",
      border: "1px solid #EADBC8",
      minHeight: "40px",
      fontSize: "14px",
      width: "100%",
      maxWidth: "300px",
    },
    selectField: {
      padding: "10px",
      borderRadius: "10px",
      border: "1px solid #EADBC8",
      minHeight: "40px",
      fontSize: "14px",
      width: "100%",
      maxWidth: "300px",
    },
    textareaField: {
      padding: "10px",
      borderRadius: "10px",
      border: "1px solid #EADBC8",
      minHeight: "40px",
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
      color: "#C2410C",
      fontSize: "14px",
      marginBottom: "10px",
      textAlign: "center",
    },
    errorContainer: {
      textAlign: "center",
      padding: "20px",
      color: "#C2410C",
      fontSize: "16px",
      fontWeight: "bold",
    },
    actionButtonContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "center",
      gap: "10px",
    },
    actionButton: {
      padding: "6px 12px",
      fontSize: "16px",
      border: "1px solid #EADBC8",
      borderRadius: "5px",
      backgroundColor: "#fff",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    editButton: {
      color: "#4CAF50",
    },
    deleteButton: {
      color: "#C2410C",
    },
  };

  return (
    <>
      <MenuBar title="Quản lý thực đơn" />
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          <h1 style={styles.title}>Thực đơn</h1>
          {errorMessage && (
            <div style={styles.errorContainer}>
              {errorMessage}
              <button
                style={{ ...styles.cancelButton, marginTop: "10px" }}
                onClick={() => {
                  localStorage.removeItem("accessToken");
                  localStorage.removeItem("userType");
                  window.location.href = "/login";
                }}
              >
                Đăng xuất
              </button>
            </div>
          )}
          {hasAdminAccess && !errorMessage && (
            <div style={styles.tableAndControls}>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                      <th style={styles.th}>Tên</th>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Giá</th>
                      <th style={styles.th}>Danh mục</th>
                      <th style={styles.th}>Mô tả</th>
                      <th style={styles.th}>Trạng thái</th>
                      <th style={styles.th}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDishes.map((dish, index) => (
                      <tr
                        key={dish.dishId}
                        style={index % 2 === 0 ? styles.evenRow : styles.oddRow}
                      >
                        <td style={styles.td}>
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <img
                              src={
                                dish.imageUrl ||
                                "/img/placeholder.jpg"
                              }
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
                        <td style={{ ...styles.td, ...styles.price }}>
                          {dish.price} VND
                        </td>
                        <td style={styles.td}>{dish.categoryName}</td>
                        <td style={styles.td}>
                          {dish.description || "Chưa có mô tả"}
                        </td>
                        <td style={styles.td}>{dish.status || "N/A"}</td>{" "}
                        {/* Thêm dữ liệu Status */}
                        <td style={styles.td}>
                          <div style={styles.actionButtonContainer}>
                            <button
                              style={{
                                ...styles.actionButton,
                                ...styles.editButton,
                              }}
                              onClick={() => handleEditDish(dish)}
                            >
                              <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                            </button>
                            <button
                              style={{
                                ...styles.actionButton,
                                ...styles.deleteButton,
                              }}
                              onClick={() => handleDeleteDish(dish)}
                            >
                              <i className="fa-regular fa-trash-can" aria-hidden="true" />
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
                  src="/img/chefmouse.png"
                  alt="Đầu bếp"
                  style={styles.chefMouseImage}
                />
              </div>
            </div>
          )}

          {showAddForm && hasAdminAccess && (
            <>
              <div
                style={styles.overlay}
                onClick={() => setShowAddForm(false)}
              ></div>
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Thêm món</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    <div style={styles.imageUploadSection}>
                      <label style={styles.imageUploadContainer}>
                        <div style={styles.imagePreview}>
                          {newDish.image ? (
                            <img
                              src={URL.createObjectURL(newDish.image)}
                              alt="Xem trước món"
                              style={styles.image}
                            />
                          ) : (
                            <div style={styles.placeholderText}>
                              Chọn ảnh định dạng .jpg, .jpeg, .png, .gif
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
                        Chọn ảnh định dạng .jpg, .jpeg, .png, .gif
                      </p>
                    </div>
                    <div style={styles.formFields}>
                      <label style={styles.formLabel}>
                        Tên <span style={styles.requiredMark}>(*)</span>:
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
                        Giá <span style={styles.requiredMark}>(*)</span>:
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
                        Danh mục <span style={styles.requiredMark}>(*)</span>:
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
                        Mô tả <span style={styles.requiredMark}>(*)</span>
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
                    <p style={styles.errorText}>{errorMessage}</p>
                  )}
                  <div style={styles.actionButtons}>
                    <button
                      onClick={validateAndAddDish}
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

          {showEditForm && hasAdminAccess && (
            <>
              <div
                style={styles.overlay}
                onClick={() => setShowEditForm(false)}
              ></div>
              <div style={styles.addFormContainer}>
                <h2 style={styles.addFormTitle}>Sửa món</h2>
                <div style={styles.addForm}>
                  <div style={styles.addFormContent}>
                    <div style={styles.imageUploadSection}>
                      <label style={styles.imageUploadContainer}>
                        <div style={styles.imagePreview}>
                          {newDish.image ? (
                            <img
                              src={URL.createObjectURL(newDish.image)}
                              alt="Xem trước món"
                              style={styles.image}
                            />
                          ) : dishToEdit.imageUrl ? (
                            <img
                              src={dishToEdit.imageUrl}
                              alt="Xem trước món"
                              style={styles.image}
                            />
                          ) : (
                            <div style={styles.placeholderText}>
                              Chọn ảnh định dạng .jpg, .jpeg, .png, .gif
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
                        Chọn ảnh định dạng .jpg, .jpeg, .png, .gif
                      </p>
                    </div>
                    <div style={styles.formFields}>
                      <label style={styles.formLabel}>
                        Tên <span style={styles.requiredMark}>(*)</span>:
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
                        Giá <span style={styles.requiredMark}>(*)</span>:
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
                        Danh mục <span style={styles.requiredMark}>(*)</span>:
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
                        Mô tả <span style={styles.requiredMark}>(*)</span>
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
                    <p style={styles.errorText}>{errorMessage}</p>
                  )}
                  <div style={styles.actionButtons}>
                    <button onClick={confirmEditDish} style={styles.addButton}>
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

          {showSuccessPopup && (
            <div style={styles.successPopup}>
              <img
                src="/img/logoremovebg.png"
                alt="Bon Appétit"
                style={styles.successImage}
              />
              <p>
                <b>Thành công</b>
              </p>
              <div style={styles.successIcon}>✔</div>
            </div>
          )}

          {showDeletePopup && hasAdminAccess && (
            <div style={styles.successPopup}>
              <img
                src="/img/logoremovebg.png"
                alt="Bon Appétit"
                style={styles.successImage}
              />
              <p>
                <b>Bạn có chắc chắn?</b>
              </p>
              <div style={styles.actionButtons}>
                <button onClick={confirmDeleteDish} style={styles.addButton}>
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
        </div>
      </div>
    </>
  );
};

export default MenuManagementAdmin;
