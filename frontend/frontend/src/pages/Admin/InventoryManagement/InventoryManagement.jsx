import React from "react";
import { useState } from "react";
import MenuBar from "../../../components/layout/MenuBar";
import logoRemoveBg from "../../../assets/img/logoremovebg.png";

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([
    {
      id: 1,
      ingredientName: "Tran Thi My Dung",
      supplierName: "ABC",
      quantity: 1,
      unit: "Kg",
      lastUpdate: "1/1/2025",
    },
    {
      id: 2,
      ingredientName: "Bui Dinh Hoang",
      supplierName: "TNH1",
      quantity: 1,
      unit: "G",
      lastUpdate: "1/1/2025",
    },
    {
      id: 3,
      ingredientName: "Tran Van Minh Tu",
      supplierName: "SHSHSH",
      quantity: 1,
      unit: "Kg",
      lastUpdate: "1/1/2025",
    },
    {
      id: 4,
      ingredientName: "Nguyen Van Java",
      supplierName: "ABD",
      quantity: 1,
      unit: "G",
      lastUpdate: "1/1/2025",
    },
    {
      id: 5,
      ingredientName: "Pham Tran React",
      supplierName: "ABFF",
      quantity: 1,
      unit: "Kg",
      lastUpdate: "1/1/2025",
    },
    {
      id: 6,
      ingredientName: "Doan Thi My SQL",
      supplierName: "ABFF",
      quantity: 1,
      unit: "G",
      lastUpdate: "1/1/2025",
    },
    {
        id: 7,
        ingredientName: "Doan Thi My SQL",
        supplierName: "ABFF",
        quantity: 1,
        unit: "G",
        lastUpdate: "1/1/2025",
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    ingredientName: "",
    supplierName: "",
    quantity: "",
    unit: "",
    lastUpdate: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  // Lấy danh sách các supplier và unit duy nhất từ inventory
  const uniqueSuppliers = [...new Set(inventory.map(item => item.supplierName))];
  const uniqueUnits = [...new Set(inventory.map(item => item.unit))];

  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setShowDeletePopup(true);
  };

  const confirmDeleteItem = () => {
    const updatedInventory = inventory.filter(
      (item) => item.id !== itemToDelete.id
    );
    setInventory(updatedInventory);
    setShowDeletePopup(false);
    setItemToDelete(null);
  };

  const handleEditItem = (item) => {
    setItemToEdit(item);
    setNewItem(item);
    setShowEditForm(true);
  };

  const confirmEditItem = () => {
    if (
      !newItem.ingredientName ||
      !newItem.supplierName ||
      !newItem.quantity ||
      !newItem.unit
    ) {
      setErrorMessage("All fields are required!");
      return;
    }

    if (isNaN(parseInt(newItem.quantity))) {
      setErrorMessage("Quantity must be a valid number!");
      return;
    }

    const updatedInventory = inventory.map((item) =>
      item.id === itemToEdit.id ? { ...newItem, id: itemToEdit.id, lastUpdate: new Date().toLocaleDateString("en-US") } : item
    );
    setInventory(updatedInventory);
    setShowEditForm(false);
    setItemToEdit(null);
    setNewItem({
      ingredientName: "",
      supplierName: "",
      quantity: "",
      unit: "",
      lastUpdate: "",
    });
    setErrorMessage("");
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 2000);
  };

  const validateAndAddItem = () => {
    if (
      !newItem.ingredientName ||
      !newItem.supplierName ||
      !newItem.quantity ||
      !newItem.unit
    ) {
      setErrorMessage("All fields are required!");
      return;
    }

    if (isNaN(parseInt(newItem.quantity))) {
      setErrorMessage("Quantity must be a valid number!");
      return;
    }

    const isDuplicate = inventory.some(
      (item) =>
        item.ingredientName.toLowerCase() ===
        newItem.ingredientName.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage("Ingredient name already exists!");
      return;
    }

    const updatedInventory = [
      ...inventory,
      { ...newItem, id: inventory.length + 1, lastUpdate: new Date().toLocaleDateString("en-US") },
    ];
    setInventory(updatedInventory);
    setShowAddForm(false);
    setNewItem({
      ingredientName: "",
      supplierName: "",
      quantity: "",
      unit: "",
      lastUpdate: "",
    });
    setErrorMessage("");
    setShowSuccessPopup(true);
    setTimeout(() => setShowSuccessPopup(false), 2000);
  };

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
      overflowX: "auto", // Cho phép kéo trượt ngang
      overflowY: "auto", // Cho phép kéo trượt dọc
      maxHeight: "500px", // Giới hạn chiều cao để kéo trượt dọc
      width: "100%",
      position: "relative",
    },
    table: {
      width: "100%",
      minWidth: "800px", // Đảm bảo table có chiều rộng tối thiểu để kéo trượt ngang
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
      width: "150px", // Chiều rộng cố định cho mỗi cột
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
      justifyContent: "center", // Thay đổi từ flex-end thành center để căn giữa
      gap: "20px", // Tăng khoảng cách giữa các nút
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
          /* Tùy chỉnh thanh cuộn */
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
        title="Inventory Management"
        icon="https://img.icons8.com/?size=100&id=4NUeu__UwtXf&format=png&color=FFFFFF" />
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          <h1 style={styles.title}>Inventory</h1>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
            <button
              style={styles.addButton}
              onClick={() => setShowAddForm(true)}
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
                  <th style={styles.th}>Quantity</th>
                  <th style={styles.th}>Unit</th>
                  <th style={styles.th}>Last Update</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item, index) => (
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
        </div>
      </div>

      {showAddForm && (
        <>
          <div
            style={styles.overlay}
            onClick={() => setShowAddForm(false)}
          ></div>
          <div style={styles.addFormContainer}>
            <h2 style={styles.addFormTitle}>Add Item</h2>
            <div style={styles.addForm}>
              <div style={styles.formFields}>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Ingredient Name<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <input
                      type="text"
                      value={newItem.ingredientName}
                      onChange={(e) =>
                        setNewItem({ ...newItem, ingredientName: e.target.value })
                      }
                      style={styles.inputField}
                    />
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Supplier Name<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <select
                      value={newItem.supplierName}
                      onChange={(e) => {
                        if (e.target.value === "new") {
                          setNewItem({ ...newItem, supplierName: "" });
                        } else {
                          setNewItem({ ...newItem, supplierName: e.target.value });
                        }
                      }}
                      style={styles.selectField}
                    >
                      <option value="">Select Supplier</option>
                      {uniqueSuppliers.map((supplier) => (
                        <option key={supplier} value={supplier}>
                          {supplier}
                        </option>
                      ))}
                      <option value="new">Add New Supplier</option>
                    </select>
                    {newItem.supplierName === "" && (
                      <input
                        type="text"
                        value={newItem.supplierName}
                        onChange={(e) =>
                          setNewItem({ ...newItem, supplierName: e.target.value })
                        }
                        style={styles.inputField}
                        placeholder="Enter new supplier"
                      />
                    )}
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Quantity<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <input
                      type="text"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: e.target.value })
                      }
                      style={styles.inputField}
                    />
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Unit<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <select
                      value={newItem.unit}
                      onChange={(e) => {
                        if (e.target.value === "new") {
                          setNewItem({ ...newItem, unit: "" });
                        } else {
                          setNewItem({ ...newItem, unit: e.target.value });
                        }
                      }}
                      style={styles.selectField}
                    >
                      <option value="">Select Unit</option>
                      {uniqueUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                      <option value="new">Add New Unit</option>
                    </select>
                    {newItem.unit === "" && (
                      <input
                        type="text"
                        value={newItem.unit}
                        onChange={(e) =>
                          setNewItem({ ...newItem, unit: e.target.value })
                        }
                        style={styles.inputField}
                        placeholder="Enter new unit"
                      />
                    )}
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Last Update</span>
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

      {showSuccessPopup && (
        <div style={styles.successPopup}>
          <img src={logoRemoveBg} alt="Bon Appétit" style={styles.successImage} />
          <p style={styles.successText}>
            <b>Successful</b>
          </p>
          <div style={styles.successIcon}>✔</div>
        </div>
      )}

      {showDeletePopup && (
        <div style={styles.successPopup}>
          <img src={logoRemoveBg} alt="Bon Appétit" style={styles.successImage} />
          <p style={styles.successText}>
            <b>Are you sure?</b>
          </p>
          <div style={{ ...styles.actionButtons, justifyContent: "center" }}>
            <button onClick={confirmDeleteItem} style={styles.addButton}>
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
            onClick={() => setShowEditForm(false)}
          ></div>
          <div style={styles.addFormContainer}>
            <h2 style={styles.addFormTitle}>Edit Item</h2>
            <div style={styles.addForm}>
              <div style={styles.formFields}>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Ingredient Name<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <input
                      type="text"
                      value={newItem.ingredientName}
                      onChange={(e) =>
                        setNewItem({ ...newItem, ingredientName: e.target.value })
                      }
                      style={styles.inputField}
                      placeholder={itemToEdit?.ingredientName}
                    />
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Supplier Name<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <select
                      value={newItem.supplierName}
                      onChange={(e) => {
                        if (e.target.value === "new") {
                          setNewItem({ ...newItem, supplierName: "" });
                        } else {
                          setNewItem({ ...newItem, supplierName: e.target.value });
                        }
                      }}
                      style={styles.selectField}
                    >
                      <option value="">Select Supplier</option>
                      {uniqueSuppliers.map((supplier) => (
                        <option key={supplier} value={supplier}>
                          {supplier}
                        </option>
                      ))}
                      <option value="new">Add New Supplier</option>
                    </select>
                      {newItem.supplierName === "" && (
                        <input
                          type="text"
                          value={newItem.supplierName}
                          onChange={(e) =>
                            setNewItem({ ...newItem, supplierName: e.target.value })
                          }
                          style={styles.inputField}
                          placeholder="Enter new supplier"
                        />
                      )}
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Quantity<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <input
                      type="text"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: e.target.value })
                      }
                      style={styles.inputField}
                      placeholder={itemToEdit?.quantity}
                    />
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Unit<span style={styles.requiredMark}>(*)</span></span>
                  <div style={styles.inputContainer}>
                    <select
                      value={newItem.unit}
                      onChange={(e) => {
                        if (e.target.value === "new") {
                          setNewItem({ ...newItem, unit: "" });
                        } else {
                          setNewItem({ ...newItem, unit: e.target.value });
                        }
                      }}
                      style={styles.selectField}
                    >
                      <option value="">Select Unit</option>
                      {uniqueUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                      <option value="new">Add New Unit</option>
                    </select>
                    {newItem.unit === "" && (
                      <input
                        type="text"
                        value={newItem.unit}
                        onChange={(e) =>
                          setNewItem({ ...newItem, unit: e.target.value })
                        }
                        style={styles.inputField}
                        placeholder="Enter new unit"
                      />
                    )}
                  </div>
                </label>
                <label style={styles.formLabel}>
                  <span style={styles.labelText}>Last Update</span>
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
    </>
  );
};

export default InventoryManagement;