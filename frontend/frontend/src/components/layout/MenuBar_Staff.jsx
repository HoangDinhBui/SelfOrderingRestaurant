import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import hook để điều hướng

const MenuBarStaff = () => {
  const [activeContainer, setActiveContainer] = useState(null); // Trạng thái để theo dõi container được chọn
  const navigate = useNavigate(); // Hook để điều hướng

  const styles = {
    menuBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between", // Căn giữa logo, tiêu đề và avatar
      backgroundColor: "#8D9EC5", // Màu nền của thanh menu
      color: "white",
      padding: "0 20px", // Khoảng cách ngang
      width: "100%",
      height: "60px", // Chiều cao cố định của thanh menu
    },
    menuLeft: {
      display: "flex", // Đặt logo và tiêu đề cùng hàng
      alignItems: "center",
    },
    menuTitleContainer: (isActive) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isActive ? "#1C2E4A" : "#8D9EC5", // Chuyển màu nền khi được chọn
      padding: "10px", // Điều chỉnh padding
      height: "100%",
      marginLeft: "15px",
      cursor: "pointer", // Thêm con trỏ chuột
    }),
    menuIcon: {
      width: "40px", // Kích thước icon
      height: "40px",
      marginRight: "10px", // Khoảng cách giữa icon và chữ
    },
    menuTitle: (isActive) => ({
      fontSize: "18px", // Điều chỉnh kích thước chữ
      fontWeight: "bold",
      color: isActive ? "white" : "#1C2E4A", // Chuyển màu chữ khi được chọn
    }),
    menuAvatar: {
      width: "50px",
      height: "50px",
      objectFit: "cover", // Cắt hình ảnh vừa khít trong khung
      borderRadius: "50%", // Bo tròn hình ảnh
    },
  };

  const handleNavigation = (container, path) => {
    setActiveContainer(container); // Cập nhật trạng thái container được chọn
    navigate(path); // Điều hướng sang trang tương ứng
  };

  return (
    <div style={styles.menuBar}>
      {/* Logo và tiêu đề */}
      <div style={styles.menuLeft}>
        <img
          src="./src/assets/img/logoremovebg.png"
          alt="Logo"
          style={styles.menuIcon}
        />
        <div
          style={styles.menuTitleContainer(activeContainer === "table")}
          onClick={() => handleNavigation("order", "/table-management")} // Điều hướng sang trang Table Management
        >
          <img
            src="https://img.icons8.com/ios-filled/50/FFFFFF/table.png"
            alt="Plate icon"
            style={styles.menuIcon}
          />
          <div style={styles.menuTitle(activeContainer === "table")}>
            <i>Table Management</i>
          </div>
        </div>

        <div
          style={styles.menuTitleContainer(activeContainer === "notification")}
          onClick={() =>
            handleNavigation("notification", "/notification-management")
          } // Điều hướng sang trang Notification Management
        >
          <img
            src="https://img.icons8.com/material-outlined/192/FFFFFF/alarm.png"
            alt="Alarm"
            style={styles.menuIcon}
          />
          <div style={styles.menuTitle(activeContainer === "notification")}>
            <i>Notification Management</i>
          </div>
        </div>

        <div
          style={styles.menuTitleContainer(activeContainer === "dish")}
          onClick={() => handleNavigation("dish", "/dish-management")} // Điều hướng sang trang Dish Management
        >
          <img
            src="./src/assets/img/mealicon.png"
            alt="Plate icon"
            style={styles.menuIcon}
          />
          <div style={styles.menuTitle(activeContainer === "dish")}>
            <i>Dish Management</i>
          </div>
        </div>

        <div
          style={styles.menuTitleContainer(activeContainer === "history")}
          onClick={() => handleNavigation("history", "/history-management")} // Điều hướng sang trang Dish Management
        >
          <img
            src="https://img.icons8.com/?size=100&id=24874&format=png&color=FFFFFF"
            alt="Plate icon"
            style={styles.menuIcon}
          />
          <div style={styles.menuTitle(activeContainer === "history")}>
            <i>Order History</i>
          </div>
        </div>

      </div>

      {/* Avatar */}
      <img
        src="./src/assets/img/MyDung.jpg"
        alt="Avatar"
        style={styles.menuAvatar}
      />
    </div>
  );
};

export default MenuBarStaff;