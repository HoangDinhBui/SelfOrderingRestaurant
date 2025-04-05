import React from "react";

const MenuBar = () => {
  const styles = {
    menuBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between", // Căn giữa logo, tiêu đề và avatar
      backgroundColor: "#8D9EC5", // Màu nền của thanh menu
      color: "white",
      padding: "0 20px", // Khoảng cách ngang
      width: "100%",
      height: "80px", // Chiều cao cố định của thanh menu
    },
    menuLeft: {
      display: "flex", // Đặt logo và tiêu đề cùng hàng
      alignItems: "center",
    },
    menuTitleContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#1C2E4A",
      padding: "20px",
      flex: 1,
      height: "100%",
      marginLeft: "15px",
    },
    menuIcon: {
      width: "40px", // Kích thước icon
      height: "40px",
      marginRight: "10px", // Khoảng cách giữa icon và chữ
    },
    menuTitle: {
      fontSize: "25px",
      fontWeight: "bold",
      color: "white", // Màu chữ
    },
    menuAvatar: {
      width: "50px",
      height: "50px",
      objectFit: "cover", // Cắt hình ảnh vừa khít trong khung
      borderRadius: "50%", // Bo tròn hình ảnh
    },
  };

  return (
    <div style={styles.menuBar}>
      {/* Logo và tiêu đề */}
      <div style={styles.menuLeft}>
        <img
          src="./src/assets/img/listicon.png"
          alt="Logo"
          style={styles.menuIcon}
        />
        <div style={styles.menuTitleContainer}>
          <img
            src="./src/assets/img/mealicon.png"
            alt="Plate icon"
            style={styles.menuIcon}
          />
          <div style={styles.menuTitle}>
            <i>Dish Management</i>
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

export default MenuBar;