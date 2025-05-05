import React, { useState, useEffect } from "react";
import MenuBar from "../../../components/layout/MenuBar";
import logoRemoveBg from "../../../assets/img/logoremovebg.png";
import { authAPI } from "../../../services/api";

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    ingredientId: "",
    quantity: "",
    unit: "",
    customUnit: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // API base URL
  const API_BASE_URL = "http://localhost:8080/api/admin";

  // Get auth headers with Bearer token
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  });

  // Fetch all inventories, suppliers, and ingredients on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchSuppliers(), fetchIngredients()]);
        await fetchInventories();
      } catch (error) {
        setErrorMessage("Lỗi khi tải dữ liệu ban đầu!");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchInventories = async () => {
    try {
      const response = await authAPI.get(`${API_BASE_URL}/inventory`, {
        headers: getAuthHeaders(),
      });
      const data = response.data || [];
      console.log("Inventories fetched:", data); // Debug
      const mappedData = data.map((item) => ({
        id: item.inventoryId,
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName || "Unknown",
        supplierName: item.supplierName || "Unknown",
        quantity: item.quantity,
        unit: item.unit,
        lastUpdate: new Date(item.lastUpdated).toLocaleDateString("en-US"),
      }));
      setInventory(mappedData);
      setFilteredInventory(mappedData);
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy danh sách inventory");
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await authAPI.get(`${API_BASE_URL}/suppliers`, {
        headers: getAuthHeaders(),
      });
      const data = response.data || [];
      console.log("Suppliers fetched:", data); // Debug
      setSuppliers(data);
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy danh sách nhà cung cấp");
    }
  };

  const fetchIngredients = async () => {
    try {
      const response = await authAPI.get(`${API_BASE_URL}/ingredient`, {
        headers: getAuthHeaders(),
      });
      const data = response.data || [];
      console.log("Ingredients fetched:", data); // Debug
      setIngredients(data);
    } catch (error) {
      handleApiError(error, "Lỗi khi lấy danh sách nguyên liệu");
    }
  };

  // Handle API errors
  const handleApiError = (error, defaultMessage) => {
    console.error(defaultMessage, error, {
      status: error.response?.status,
      data: error.response?.data,
    });
    const status = error.response?.status;
    let message = error.response?.data?.message || defaultMessage;
    if (status === 403 || status === 401) {
      message = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      localStorage.clear();
      window.location.href = "/login";
    } else if (status === 404) {
      message = `Không tìm thấy endpoint: ${error.config.url}`;
    } else if (status === 400) {
      message = error.response?.data?.message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại!";
    }
    setErrorMessage(message);
  };

  // Handle search by ingredient name
  const handleSearch = (event) => {
    if (event.key === "Enter") {
      if (searchTerm.trim() === "") {
        setFilteredInventory(inventory);
      } else {
        const filtered = inventory.filter((item) =>
          item.ingredientName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredInventory(filtered);
      }
    }
  };

  // Handle delete inventory
  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setShowDeletePopup(true);
  };

  const confirmDeleteItem = async () => {
    try {
      await authAPI.delete(`${API_BASE_URL}/inventory/${itemToDelete.id}`, {
        headers: getAuthHeaders(),
      });
      const updatedInventory = inventory.filter(
        (item) => item.id !== itemToDelete.id
      );
      setInventory(updatedInventory);
      setFilteredInventory(updatedInventory);
      setShowDeletePopup(false);
      setItemToDelete(null);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
    } catch (error) {
      handleApiError(error, "Lỗi khi xóa inventory");
    }
  };

  // Handle edit inventory
  const handleEditItem = (item) => {
    setItemToEdit(item);
    setNewItem({
      ingredientId: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit,
      customUnit: "",
    });
    setShowEditForm(true);
  };

  const confirmEditItem = async () => {
    if (!newItem.quantity || !newItem.unit) {
      setErrorMessage("Số lượng và đơn vị là bắt buộc!");
      return;
    }
    const parsedQuantity = parseFloat(newItem.quantity);
    const finalUnit = newItem.unit === "new" ? newItem.customUnit : newItem.unit;
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setErrorMessage("Số lượng phải là số dương!");
      return;
    }
    if (!finalUnit) {
      setErrorMessage("Đơn vị không hợp lệ!");
      return;
    }
    try {
      await authAPI.put(
        `${API_BASE_URL}/inventory/${itemToEdit.id}`,
        {
          quantity: parsedQuantity,
          unit: finalUnit,
          lastUpdated: new Date().toISOString().split("T")[0],
        },
        { headers: getAuthHeaders() }
      );
      await fetchInventories();
      setShowEditForm(false);
      setItemToEdit(null);
      setNewItem({ ingredientId: "", quantity: "", unit: "", customUnit: "" });
      setErrorMessage("");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
    } catch (error) {
      handleApiError(error, "Lỗi khi cập nhật inventory");
    }
  };

  // Handle add inventory
  const validateAndAddItem = async () => {
    console.log("New item:", newItem); // Debug
    console.log("Ingredients:", ingredients); // Debug
    if (!newItem.ingredientId || !newItem.quantity || !newItem.unit) {
      setErrorMessage("Tất cả các trường đều bắt buộc!");
      return;
    }
    const parsedIngredientId = parseInt(newItem.ingredientId);
    const parsedQuantity = parseFloat(newItem.quantity);
    const finalUnit = newItem.unit === "new" ? newItem.customUnit : newItem.unit;
    if (isNaN(parsedIngredientId) || parsedIngredientId <= 0) {
      setErrorMessage("ID nguyên liệu phải là số dương hợp lệ!");
      return;
    }
    if (ingredients.length === 0) {
      setErrorMessage("Không thể tải danh sách nguyên liệu. Vui lòng thử lại!");
      return;
    }
    const ingredient = ingredients.find(ing => ing.ingredientId === parsedIngredientId);
    if (!ingredient) {
      setErrorMessage(`Nguyên liệu với ID ${parsedIngredientId} không tồn tại!`);
      return;
    }
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setErrorMessage("Số lượng phải là số dương!");
      return;
    }
    if (!finalUnit) {
      setErrorMessage("Đơn vị không hợp lệ!");
      return;
    }
    try {
      await authAPI.post(
        `${API_BASE_URL}/inventory`,
        {
          ingredientId: parsedIngredientId,
          quantity: parsedQuantity,
          unit: finalUnit,
          lastUpdated: new Date().toISOString().split("T")[0],
        },
        { headers: getAuthHeaders() }
      );
      await fetchInventories();
      setShowAddForm(false);
      setNewItem({ ingredientId: "", quantity: "", unit: "", customUnit: "" });
      setErrorMessage("");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
    } catch (error) {
      handleApiError(error, "Lỗi khi thêm inventory");
    }
  };

  // Unique units for dropdown
  const uniqueUnits = [...new Set(inventory.map((item) => item.unit))];

  const styles = {
    outerContainer: {
      fontFamily: "'Poppins', sans-serif",
      backgroundColor: "rgba(157, 198, 206, 0.3)",
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
      borderRadius: "15px",
      padding: "25px",
      boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
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
      marginBottom: "20px",
      color: "#2c3e50",
    },
    tableContainer: {
      backgroundColor: "rgba(157, 198, 206, 0.3)",
      borderRadius: "10px",
      overflowX: "auto",
      overflowY: "auto",
      maxHeight: "500px",
      width: "100%",
      position: "relative",
    },
    table: {
      width: "100%",
      minWidth: "800px",
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
      padding: "12px",
      textAlign: "center",
      color: "#ffffff",
      width: "150px",
      minWidth: "150px",
    },
    td: {
      border: "1px solid #9DC6CE",
      padding: "12px",
      textAlign: "center",
      width: "150px",
      minWidth: "150px",
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
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      zIndex: 999,
      backdropFilter: "blur(5px)",
    },
    addFormContainer: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "linear-gradient(135deg, #ffffff, #f1f8ff)",
      padding: "30px",
      borderRadius: "20px",
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.25)",
      zIndex: "1000",
      width: "650px",
      maxWidth: "95%",
      height: "auto",
      maxHeight: "90vh",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      border: "2px solid #9DC6CE",
    },
    addFormTitle: {
      fontSize: "30px",
      fontWeight: "600",
      marginBottom: "25px",
      textAlign: "center",
      color: "#2c3e50",
      textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)",
    },
    addForm: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      width: "100%",
    },
    addButton: {
      padding: "12px 25px",
      background: "linear-gradient(90deg, #2ecc71, #27ae60)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "16px",
      transition: "transform 0.2s, box-shadow 0.3s",
      boxShadow: "0 4px 10px rgba(46, 204, 113, 0.3)",
    },
    cancelButton: {
      padding: "12px 25px",
      background: "linear-gradient(90deg, #e74c3c, #c0392b)",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "16px",
      transition: "transform 0.2s, box-shadow 0.3s",
      boxShadow: "0 4px 10px rgba(231, 76, 60, 0.3)",
    },
    actionButtons: {
      display: "flex",
      justifyContent: "center",
      gap: "20px",
      marginTop: "25px",
      width: "100%",
    },
    formFields: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      width: "100%",
    },
    formLabel: {
      fontSize: "16px",
      fontWeight: "600",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "20px",
      color: "#34495e",
      width: "100%",
      transition: "color 0.3s",
    },
    labelText: {
      flex: "0 0 150px",
      textAlign: "right",
    },
    inputContainer: {
      flex: "1",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    requiredMark: {
      color: "#e74c3c",
      marginLeft: "5px",
    },
    inputField: {
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      fontSize: "16px",
      width: "100%",
      boxSizing: "border-box",
      backgroundColor: "#f9f9f9",
      transition: "border-color 0.3s, box-shadow 0.3s",
    },
    selectField: {
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      fontSize: "16px",
      width: "100%",
      boxSizing: "border-box",
      backgroundColor: "#f9f9f9",
      transition: "border-color 0.3s, box-shadow 0.3s",
    },
    successPopup: {
      position: "fixed",
      width: "300px",
      height: "250px",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "linear-gradient(135deg, #ffffff, #e8f5e9)",
      padding: "25px",
      borderRadius: "20px",
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.25)",
      textAlign: "center",
      zIndex: "1001",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      border: "2px solid #2ecc71",
    },
    successIcon: {
      fontSize: "32px",
      color: "#2ecc71",
      marginTop: "15px",
      animation: "bounce 0.5s ease-in-out",
    },
    successImage: {
      width: "120px",
      height: "auto",
      marginBottom: "15px",
      filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))",
    },
    successText: {
      fontSize: "22px",
      fontWeight: "600",
      marginBottom: "10px",
      color: "#2c3e50",
      textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)",
    },
    errorText: {
      color: "#e74c3c",
      fontSize: "16px",
      marginBottom: "15px",
      textAlign: "center",
      width: "100%",
      fontWeight: "500",
    },
    searchRow: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "10px",
      marginBottom: "20px",
    },
    input: {
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #ddd",
      fontSize: "16px",
      width: "200px",
      boxSizing: "border-box",
      backgroundColor: "#f9f9f9",
      transition: "border-color 0.3s, box-shadow 0.3s",
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes bounce {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
          button:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
          }
          input:focus, select:focus {
            border-color: #9DC6CE;
            box-shadow: 0 0 8px rgba(157, 198, 206, 0.5);
            outline: none;
          }
          label:hover {
            color: #2c3e50;
          }
          div::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          div::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb {
            background: #9DC6CE;
            border-radius: 10px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #7daab3;
          }
        `}
      </style>
      <MenuBar
        title="Quản Lý Inventory"
        icon="https://img.icons8.com/?size=100&id=4NUeu__UwtXf&format=png&color=FFFFFF"
      />
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          <h1 style={styles.title}>Inventory</h1>
          {isLoading ? (
            <p>Đang tải dữ liệu...</p>
          ) : (
            <>
              <div style={styles.searchRow}>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên nguyên liệu..."
                  style={styles.input}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                />
                <button
                  style={styles.addButton}
                  onClick={() => setShowAddForm(true)}
                  disabled={ingredients.length === 0}
                >
                  +
                </button>
              </div>
              <div style={styles.tableContainer}>
                <table style={styles.table}>
                  <thead style={styles.thead}>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Ingredient Name</th>
                      <th style={styles.th}>Supplier Name</th>
                      <th style={styles.th}>Quality</th>
                      <th style={styles.th}>Unit</th>
                      <th style={styles.th}>Last Update</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item, index) => (
                      <tr
                        key={item.id}
                        style={index % 2 === 0 ? styles.evenRow : styles.oddRow}
                      >
                        <td style={styles.td}>{item.id}</td>
                        <td style={styles.td}>{item.ingredientName}</td>
                        <td style={styles.td}>{item.supplierName}</td>
                        <td style={styles.td}>{item.quantity}</td>
                        <td style={styles.td}>{item.unit}</td>
                        <td style={styles.td}>{item.lastUpdate}</td>
                        <td style={styles.td}>
                          <button
                            style={{ marginRight: "10px", cursor: "pointer" }}
                            onClick={() => handleEditItem(item)}
                          >
                            ✏️
                          </button>
                          <button
                            style={{ cursor: "pointer" }}
                            onClick={() => handleDeleteItem(item)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {showAddForm && !isLoading && ingredients.length > 0 && (
        <>
          <div
            style={styles.overlay}
            onClick={() => setShowAddForm(false)}
          ></div>
          <div style={styles.addFormContainer}>
            <h2 style={styles.addFormTitle}>Thêm Mục Inventory</h2>
            <div style={styles.addForm}>
              <div style={styles.formFields}>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Nguyên liệu<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <select
                      value={newItem.ingredientId}
                      onChange={(e) =>
                        setNewItem({ ...newItem, ingredientId: e.target.value })
                      }
                      style={styles.selectField}
                    >
                      <option value="">Chọn nguyên liệu</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.ingredientId} value={ingredient.ingredientId}>
                          {ingredient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Số lượng<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: e.target.value })
                      }
                      style={styles.inputField}
                      placeholder="Nhập số lượng (ví dụ: 25.5)"
                    />
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Đơn vị<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <select
                      value={newItem.unit === "new" ? "" : newItem.unit}
                      onChange={(e) =>
                        setNewItem({ ...newItem, unit: e.target.value || "new" })
                      }
                      style={styles.selectField}
                    >
                      <option value="">Chọn đơn vị</option>
                      {uniqueUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                      <option value="new">Thêm đơn vị mới</option>
                    </select>
                    {newItem.unit === "new" && (
                      <input
                        type="text"
                        value={newItem.customUnit || ""}
                        onChange={(e) =>
                          setNewItem({ ...newItem, customUnit: e.target.value, unit: e.target.value })
                        }
                        style={styles.inputField}
                        placeholder="Nhập đơn vị mới (ví dụ: lít)"
                      />
                    )}
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Ngày cập nhật</span>
                  <div style={styles.inputContainer}>
                    <input
                      type="text"
                      value={new Date().toLocaleDateString("en-US")}
                      disabled
                      style={styles.inputField}
                    />
                  </div>
                </label>
              </div>
              {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}
              <div style={styles.actionButtons}>
                <button onClick={validateAndAddItem} style={styles.addButton}>
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
          <img src={logoRemoveBg} alt="Bon Appétit" style={styles.successImage} />
          <p style={styles.successText}>
            <b>Thành công</b>
          </p>
          <div style={styles.successIcon}>✔</div>
        </div>
      )}

      {showDeletePopup && (
        <div style={styles.successPopup}>
          <img src={logoRemoveBg} alt="Bon Appétit" style={styles.successImage} />
          <p style={styles.successText}>
            <b>Bạn có chắc chắn?</b>
          </p>
          <div style={{ ...styles.actionButtons, justifyContent: "center" }}>
            <button onClick={confirmDeleteItem} style={styles.addButton}>
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

      {showEditForm && !isLoading && (
        <>
          <div
            style={styles.overlay}
            onClick={() => setShowEditForm(false)}
          ></div>
          <div style={styles.addFormContainer}>
            <h2 style={styles.addFormTitle}>Chỉnh Sửa Mục</h2>
            <div style={styles.addForm}>
              <div style={styles.formFields}>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Nguyên liệu<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <select
                      value={newItem.ingredientId}
                      onChange={(e) =>
                        setNewItem({ ...newItem, ingredientId: e.target.value })
                      }
                      style={styles.selectField}
                      disabled
                    >
                      <option value="">Chọn nguyên liệu</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.ingredientId} value={ingredient.ingredientId}>
                          {ingredient.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Số lượng<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: e.target.value })
                      }
                      style={styles.inputField}
                      placeholder="Nhập số lượng (ví dụ: 25.5)"
                    />
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Đơn vị<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <select
                      value={newItem.unit === "new" ? "" : newItem.unit}
                      onChange={(e) =>
                        setNewItem({ ...newItem, unit: e.target.value || "new" })
                      }
                      style={styles.selectField}
                    >
                      <option value="">Chọn đơn vị</option>
                      {uniqueUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                      <option value="new">Thêm đơn vị mới</option>
                    </select>
                    {newItem.unit === "new" && (
                      <input
                        type="text"
                        value={newItem.customUnit || ""}
                        onChange={(e) =>
                          setNewItem({ ...newItem, customUnit: e.target.value, unit: e.target.value })
                        }
                        style={styles.inputField}
                        placeholder="Nhập đơn vị mới (ví dụ: lít)"
                      />
                    )}
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Ngày cập nhật</span>
                  <div style={styles.inputContainer}>
                    <input
                      type="text"
                      value={new Date().toLocaleDateString("en-US")}
                      disabled
                      style={styles.inputField}
                    />
                  </div>
                </label>
              </div>
              {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}
              <div style={styles.actionButtons}>
                <button onClick={confirmEditItem} style={styles.addButton}>
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
    </>
  );
};

export default InventoryManagement;