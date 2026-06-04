import React, { useState, useEffect } from "react";
import MenuBar from "../../../components/layout/MenuBar";
import { authAPI } from "../../../services/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "CUSTOMER",
  });

  const [showEditForm, setShowEditForm] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userType");
    setUserRole(role);
    if (role !== "ADMIN") {
      setErrorMessage("Access denied: Administrator privileges required.");
    } else {
      fetchUsers();
    }
  }, []);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  });

  const fetchUsers = async () => {
    try {
      const response = await authAPI.get("/admin/users", {
        headers: getAuthHeaders(),
      });
      setUsers(response.data.filter(u => u.userStatus !== "INACTIVE"));
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage(
        error.response?.status === 403
          ? "Access denied: Administrator privileges required."
          : "Error while fetching users list"
      );
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.role) {
      setErrorMessage("Please fill all fields");
      return;
    }
    try {
      await authAPI.post("/admin/users", newUser, {
        headers: getAuthHeaders(),
      });
      setShowAddForm(false);
      setNewUser({ username: "", password: "", role: "CUSTOMER" });
      setSuccessMessage("User created successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
      fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data || "Error creating user");
    }
  };

  const handleEditUser = async () => {
    if (!userToEdit.role || !userToEdit.userStatus) {
      setErrorMessage("Please fill all fields");
      return;
    }
    try {
      const payload = {
        role: userToEdit.role,
        userStatus: userToEdit.userStatus
      };
      if (userToEdit.password) {
        payload.password = userToEdit.password;
      }
      
      await authAPI.put(`/admin/users/${userToEdit.userId}`, payload, {
        headers: getAuthHeaders(),
      });
      setShowEditForm(false);
      setUserToEdit(null);
      setSuccessMessage("User updated successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
      fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data || "Error updating user");
    }
  };

  const confirmDeleteUser = async () => {
    try {
      await authAPI.delete(`/admin/users/${userToDelete.userId}`, {
        headers: getAuthHeaders(),
      });
      setShowDeletePopup(false);
      setUserToDelete(null);
      setSuccessMessage("User deleted successfully!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
      fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data || "Error deleting user");
    }
  };

  if (userRole !== "ADMIN") {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", backgroundColor: "#f0f8fd" }}>
        <MenuBar title="User Management" icon="https://img.icons8.com/ios-filled/50/FFFFFF/user.png" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#fee2e2", border: "1px solid #f87171", color: "#b91c1c", padding: "16px 24px", borderRadius: "8px", fontSize: "20px" }}>
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
    tableContainer: {
      flex: 3,
      backgroundColor: "rgba(157, 198, 206, 0.3)",
      borderRadius: "10px",
      overflowY: "auto",
      maxHeight: "500px",
      width: "100%",
      marginTop: "20px"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      border: "2px solid #9DC6CE",
    },
    thead: {
      position: "sticky",
      top: 0,
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
    addButton: {
      padding: "10px 20px",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      alignSelf: "flex-end"
    },
    actionButton: {
      padding: "5px 10px",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      marginRight: "5px"
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
    modalContainer: {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      zIndex: 1000,
      width: "400px",
      maxWidth: "90%",
    },
    modalTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "15px",
      textAlign: "center",
    },
    inputField: {
      width: "100%",
      padding: "10px",
      marginBottom: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      boxSizing: "border-box",
    },
    actionButtons: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "20px",
    },
    cancelButton: {
      padding: "10px 20px",
      backgroundColor: "#e74c3c",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    errorText: {
      color: "#e74c3c",
      fontSize: "14px",
      marginBottom: "10px",
      textAlign: "center",
    }
  };

  return (
    <>
      <MenuBar title="User Management" icon="https://img.icons8.com/ios-filled/50/FFFFFF/user.png" />
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          <h2 style={styles.title}>System Users</h2>
          
          <button style={styles.addButton} onClick={() => setShowAddForm(true)}>
            + Add User
          </button>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId}>
                    <td style={styles.td}>{user.userId}</td>
                    <td style={styles.td}>{user.username}</td>
                    <td style={styles.td}>{user.role}</td>
                    <td style={styles.td}>{user.userStatus}</td>
                    <td style={styles.td}>
                      <button 
                        style={{...styles.actionButton, backgroundColor: "#f39c12"}}
                        onClick={() => {
                          setUserToEdit({ ...user, password: "" });
                          setShowEditForm(true);
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        style={{...styles.actionButton, backgroundColor: "#e74c3c"}}
                        onClick={() => {
                          setUserToDelete(user);
                          setShowDeletePopup(true);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddForm && (
        <>
          <div style={styles.overlay} onClick={() => setShowAddForm(false)}></div>
          <div style={styles.modalContainer}>
            <h3 style={styles.modalTitle}>Add New User</h3>
            {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}
            <input 
              style={styles.inputField} 
              placeholder="Username" 
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
            />
            <input 
              style={styles.inputField} 
              type="password"
              placeholder="Password" 
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            />
            <select 
              style={styles.inputField}
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
            >
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            
            <div style={styles.actionButtons}>
              <button style={styles.cancelButton} onClick={() => setShowAddForm(false)}>Cancel</button>
              <button style={styles.addButton} onClick={handleAddUser}>Save</button>
            </div>
          </div>
        </>
      )}

      {/* Edit User Modal */}
      {showEditForm && userToEdit && (
        <>
          <div style={styles.overlay} onClick={() => setShowEditForm(false)}></div>
          <div style={styles.modalContainer}>
            <h3 style={styles.modalTitle}>Edit User</h3>
            {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}
            
            <input 
              style={styles.inputField} 
              disabled
              value={userToEdit.username}
            />
            
            <input 
              style={styles.inputField} 
              type="password"
              placeholder="New Password (leave blank to keep current)" 
              value={userToEdit.password}
              onChange={(e) => setUserToEdit({...userToEdit, password: e.target.value})}
            />

            <select 
              style={styles.inputField}
              value={userToEdit.role}
              onChange={(e) => setUserToEdit({...userToEdit, role: e.target.value})}
            >
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>

            <select 
              style={styles.inputField}
              value={userToEdit.userStatus}
              onChange={(e) => setUserToEdit({...userToEdit, userStatus: e.target.value})}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="BANNED">BANNED</option>
            </select>
            
            <div style={styles.actionButtons}>
              <button style={styles.cancelButton} onClick={() => setShowEditForm(false)}>Cancel</button>
              <button style={styles.addButton} onClick={handleEditUser}>Update</button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <>
          <div style={styles.overlay} onClick={() => setShowDeletePopup(false)}></div>
          <div style={{...styles.modalContainer, textAlign: "center"}}>
            <h3 style={styles.modalTitle}>Confirm Delete</h3>
            <p>Are you sure you want to delete user <strong>{userToDelete?.username}</strong>?</p>
            <div style={{...styles.actionButtons, justifyContent: "center"}}>
              <button style={styles.cancelButton} onClick={() => setShowDeletePopup(false)}>Cancel</button>
              <button style={{...styles.addButton, backgroundColor: "#e74c3c"}} onClick={confirmDeleteUser}>Delete</button>
            </div>
          </div>
        </>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", 
          backgroundColor: "#4CAF50", color: "white", padding: "15px", 
          borderRadius: "5px", zIndex: 2000, boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
        }}>
          {successMessage}
        </div>
      )}
    </>
  );
};

export default UserManagement;
