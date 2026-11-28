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
      setErrorMessage("Không có quyền truy cập: cần quyền quản trị viên.");
    } else {
      fetchUsers();
    }
  }, []);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  });

  const fetchUsers = async () => {
    try {
      const response = await authAPI.get("/api/admin/users", {
        headers: getAuthHeaders(),
      });
      setUsers(response.data.filter(u => u.userStatus !== "INACTIVE"));
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage(
        error.response?.status === 403
          ? "Không có quyền truy cập: cần quyền quản trị viên."
          : "Lỗi khi tải danh sách người dùng"
      );
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.role) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      await authAPI.post("/api/admin/users", newUser, {
        headers: getAuthHeaders(),
      });
      setShowAddForm(false);
      setNewUser({ username: "", password: "", role: "CUSTOMER" });
      setSuccessMessage("Đã tạo người dùng!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
      fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data || "Lỗi khi tạo người dùng");
    }
  };

  const handleEditUser = async () => {
    if (!userToEdit.role || !userToEdit.userStatus) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin");
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
      
      await authAPI.put(`/api/admin/users/${userToEdit.userId}`, payload, {
        headers: getAuthHeaders(),
      });
      setShowEditForm(false);
      setUserToEdit(null);
      setSuccessMessage("Đã cập nhật người dùng!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
      fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data || "Lỗi khi cập nhật người dùng");
    }
  };

  const confirmDeleteUser = async () => {
    try {
      await authAPI.delete(`/api/admin/users/${userToDelete.userId}`, {
        headers: getAuthHeaders(),
      });
      setShowDeletePopup(false);
      setUserToDelete(null);
      setSuccessMessage("Đã xóa người dùng!");
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 2000);
      fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data || "Lỗi khi xóa người dùng");
    }
  };

  if (userRole !== "ADMIN") {
    return (
      <div style={{ height: "100vh", width: "100%", display: "flex", flexDirection: "column", backgroundColor: "#f0f8fd" }}>
        <MenuBar title="Quản lý người dùng" icon="https://img.icons8.com/ios-filled/50/FFFFFF/user.png" />
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
      fontSize: "35px",
      fontWeight: "bold",
      marginBottom: "15px",
    },
    tableContainer: {
      flex: 3,
      backgroundColor: "#F6EEE3",
      borderRadius: "10px",
      overflowY: "auto",
      maxHeight: "500px",
      width: "100%",
      marginTop: "20px"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      border: "2px solid #EADBC8",
    },
    thead: {
      position: "sticky",
      top: 0,
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
    addButton: {
      padding: "10px 20px",
      backgroundColor: "#C2410C",
      color: "white",
      border: "none",
      borderRadius: "10px",
      fontWeight: 600,
      minHeight: "40px",
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
      width: "100%",
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
      borderRadius: "10px",
      border: "1px solid #EADBC8",
      minHeight: "40px",
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
      backgroundColor: "#FFFFFF",
      color: "#33261D",
      border: "1px solid #EADBC8",
      borderRadius: "10px",
      fontWeight: 600,
      minHeight: "40px",
      cursor: "pointer",
    },
    errorText: {
      color: "#C2410C",
      fontSize: "14px",
      marginBottom: "10px",
      textAlign: "center",
    }
  };

  return (
    <>
      <MenuBar title="Quản lý người dùng" icon="https://img.icons8.com/ios-filled/50/FFFFFF/user.png" />
      <div style={styles.outerContainer}>
        <div style={styles.innerContainer}>
          <h2 style={styles.title}>Người dùng hệ thống</h2>
          
          <button style={styles.addButton} onClick={() => setShowAddForm(true)}>
            + Thêm người dùng
          </button>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Tên đăng nhập</th>
                  <th style={styles.th}>Vai trò</th>
                  <th style={styles.th}>Trạng thái</th>
                  <th style={styles.th}>Thao tác</th>
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
                        Sửa
                      </button>
                      <button 
                        style={{...styles.actionButton, backgroundColor: "#e74c3c"}}
                        onClick={() => {
                          setUserToDelete(user);
                          setShowDeletePopup(true);
                        }}
                      >
                        Xóa
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
            <h3 style={styles.modalTitle}>Thêm người dùng mới</h3>
            {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}
            <input 
              style={styles.inputField} 
              placeholder="Tên đăng nhập" 
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
            />
            <input 
              style={styles.inputField} 
              type="password"
              placeholder="Mật khẩu" 
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
              <button style={styles.cancelButton} onClick={() => setShowAddForm(false)}>Hủy</button>
              <button style={styles.addButton} onClick={handleAddUser}>Lưu</button>
            </div>
          </div>
        </>
      )}

      {/* Edit User Modal */}
      {showEditForm && userToEdit && (
        <>
          <div style={styles.overlay} onClick={() => setShowEditForm(false)}></div>
          <div style={styles.modalContainer}>
            <h3 style={styles.modalTitle}>Sửa người dùng</h3>
            {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}
            
            <input 
              style={styles.inputField} 
              disabled
              value={userToEdit.username}
            />
            
            <input 
              style={styles.inputField} 
              type="password"
              placeholder="Mật khẩu mới (để trống nếu giữ nguyên)" 
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
              <button style={styles.cancelButton} onClick={() => setShowEditForm(false)}>Hủy</button>
              <button style={styles.addButton} onClick={handleEditUser}>Cập nhật</button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <>
          <div style={styles.overlay} onClick={() => setShowDeletePopup(false)}></div>
          <div style={{...styles.modalContainer, textAlign: "center"}}>
            <h3 style={styles.modalTitle}>Xác nhận xóa</h3>
            <p>Bạn có chắc muốn xóa người dùng <strong>{userToDelete?.username}</strong>?</p>
            <div style={{...styles.actionButtons, justifyContent: "center"}}>
              <button style={styles.cancelButton} onClick={() => setShowDeletePopup(false)}>Hủy</button>
              <button style={{...styles.addButton, backgroundColor: "#e74c3c"}} onClick={confirmDeleteUser}>Xóa</button>
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
