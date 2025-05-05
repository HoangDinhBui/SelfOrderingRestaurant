import React, { useState, useEffect } from "react";
import { authAPI } from "../../../services/api";
import MenuBar from "../../../components/layout/MenuBar";
import logoRemoveBg from "../../../assets/img/logoremovebg.png";

const MenuManagementAdmin = () => {
  const [dishes, setDishes] = useState([]);
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
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = "http://localhost:8080/api";

  // Get auth headers with Bearer token
  const getAuthHeaders = () => ({
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  });

  // Fetch dishes on component mount
  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    setIsLoading(true);
    try {
      const response = await authAPI.get(`${API_URL}/dishes`, {
        headers: getAuthHeaders(),
      });
      const data = response.data || [];
      setDishes(data);
      setFilteredDishes(data);
    } catch (error) {
      handleApiError(error, "Failed to load dishes.");
    } finally {
      setIsLoading(false);
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
      message = "Session expired. Please log in again.";
      localStorage.clear();
      window.location.href = "/login";
    } else if (status === 404) {
      message = `Endpoint not found: ${error.config.url}`;
    } else if (status === 400) {
      message = error.response?.data?.message || "Invalid data. Please check again!";
    }
    setErrorMessage(message);
  };

  // Handle search by dish name
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
      setErrorMessage("All fields are required!");
      return;
    }

    if (isNaN(parseFloat(newDish.price))) {
      setErrorMessage("Price must be a valid number!");
      return;
    }

    const isDuplicate = dishes.some(
      (dish) => dish.dishName.toLowerCase() === newDish.name.toLowerCase()
    );
    if (isDuplicate) {
      setErrorMessage("Dish name already exists!");
      return;
    }

    const formData = new FormData();
    formData.append("name", newDish.name);
    formData.append("price", parseFloat(newDish.price));
    formData.append("categoryId", newDish.category === "Appetizers" ? 1 : newDish.category === "Main" ? 2 : 3);
    formData.append("description", newDish.description);
    formData.append("image", newDish.image);
    formData.append("status", "AVAILABLE");

    try {
      await authAPI.post(`${API_URL}/admin/dishes`, formData, {
        headers: getAuthHeaders(),
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
      await fetchDishes();
    } catch (error) {
      handleApiError(error, "Failed to add dish.");
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
      setErrorMessage("All fields are required!");
      return;
    }

    if (isNaN(parseFloat(newDish.price))) {
      setErrorMessage("Price must be a valid number!");
      return;
    }

    const formData = new FormData();
    formData.append("name", newDish.name);
    formData.append("price", parseFloat(newDish.price));
    formData.append("categoryId", newDish.category === "Appetizers" ? 1 : newDish.category === "Main" ? 2 : 3);
    formData.append("description", newDish.description);
    if (newDish.image) {
      formData.append("image", newDish.image);
    }
    formData.append("status", "AVAILABLE");

    try {
      await authAPI.post(`${API_URL}/dishes/${dishToEdit.dishId}`, formData, {
        headers: getAuthHeaders(),
      });
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
      await fetchDishes();
    } catch (error) {
      handleApiError(error, "Failed to update dish.");
    }
  };

  // Delete dish
  const handleDeleteDish = (dish) => {
    setDishToDelete(dish);
    setShowDeletePopup(true);
  };

  const confirmDeleteDish = async () => {
    try {
      await authAPI.delete(`${API_URL}/dishes/${dishToDelete.dishId}`, {
        headers: getAuthHeaders(),
      });
      setShowDeletePopup(false);
      setDishToDelete(null);
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
      await fetchDishes();
    } catch (error) {
      handleApiError(error, "Failed to delete dish.");
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
  };

  return (
    <>
      <MenuBar title="Menu Management" />
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          <h1 style={styles.title}>Menu</h1>
          {isLoading ? (
            <p>Loading dishes...</p>
          ) : (
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
                          <button
                            style={{ marginRight: "10px", cursor: "pointer" }}
                            onClick={() => handleEditDish(dish)}
                          >
                            ✏️
                          </button>
                          <button
                            style={{ cursor: "pointer" }}
                            onClick={() => handleDeleteDish(dish)}
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
          )}

          {showAddForm && !isLoading && (
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
                          <option value="Appetizers">Appetizers</option>
                          <option value="Main">Main</option>
                          <option value="Desserts">Desserts</option>
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

          {showEditForm && !isLoading && (
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
                          <option value="Appetizers">Appetizers</option>
                          <option value="Main">Main</option>
                          <option value="Desserts">Desserts</option>
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