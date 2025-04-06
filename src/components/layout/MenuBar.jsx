import React, { useState } from "react";
import MiniList from "./MiniList"; // Import MiniList component

const MenuBar = ({ title = "Management" }) => { // Nhận title từ props, mặc định là "Management"
  const [isMiniListVisible, setMiniListVisible] = useState(false); // Trạng thái hiển thị MiniList

  const styles = {
    menuBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between", // Căn giữa logo, tiêu đề và avatar
      backgroundColor: "#8D9EC5", // Màu nền của thanh menu
      color: "white",
      padding: "10px", // Khoảng cách ngang
      width: "100%",
      height: "60px", // Chiều cao cố định của thanh menu
      zIndex: 2, // Đảm bảo thanh menu luôn ở trên cùng
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.33)",
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
      padding: "10px",
      flex: 1,
      height: "100%",
      marginLeft: "15px",
    },
    menuIcon: {
      width: "40px", // Kích thước icon
      height: "40px",
      marginRight: "10px", // Khoảng cách giữa icon và chữ
      cursor: "pointer", // Thêm con trỏ chuột
    },
    menuTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "white", // Màu chữ
    },
    menuAvatar: {
      width: "50px",
      height: "50px",
      objectFit: "cover", // Cắt hình ảnh vừa khít trong khung
      borderRadius: "50%", // Bo tròn hình ảnh
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.3)", // Màu đen với độ mờ 30%
      zIndex: 1, // Đảm bảo overlay nằm dưới MiniList nhưng trên nội dung khác
    },
    miniListContainer: {
      position: "absolute",
      top: "80px", // Hiển thị MiniList ngay dưới thanh menu
      left: "20px",
      zIndex: 2, // Đảm bảo MiniList nằm trên overlay
    },
  };

  const items = [
    {
      label: "Table Management",
      icon: "https://img.icons8.com/ios-filled/50/1C2E4A/table.png",
    },
    {
      label: "Menu Management",
      icon: "https://img.icons8.com/ios-filled/50/1C2E4A/menu.png",
    },
    {
      label: "Staff Management",
      icon: "https://img.icons8.com/ios-filled/50/1C2E4A/user.png",
    },
    {
      label: "Revenue Management",
      icon: "https://img.icons8.com/ios-filled/50/1C2E4A/money.png",
    },
    {
      label: "Evaluate",
      icon: "https://img.icons8.com/ios-filled/50/1C2E4A/bookmark.png",
    },
  ];

  const handleToggleMiniList = () => {
    setMiniListVisible(!isMiniListVisible); // Bật/tắt MiniList
  };

  const handleOverlayClick = () => {
    setMiniListVisible(false); // Ẩn MiniList khi nhấn vào overlay
  };

  return (
    <>
      <div style={styles.menuBar}>
        {/* Logo và tiêu đề */}
        <div style={styles.menuLeft}>
          <img
            src="./src/assets/img/listicon.png"
            alt="Logo"
            style={styles.menuIcon}
            onClick={handleToggleMiniList} // Hiển thị MiniList khi nhấn vào icon
          />
          <div style={styles.menuTitleContainer}>
            <img
              src="./src/assets/img/mealicon.png"
              alt="Plate icon"
              style={styles.menuIcon}
            />
            <div style={styles.menuTitle}>
              <i>{title}</i> {/* Hiển thị nội dung từ props */}
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

      {/* Overlay */}
      {isMiniListVisible && (
        <div style={styles.overlay} onClick={handleOverlayClick}></div>
      )}

      {/* MiniList */}
      {isMiniListVisible && (
        <div style={styles.miniListContainer}>
          <MiniList
            items={items}
            onSelect={(item) => {
              console.log("Selected item:", item);
              setMiniListVisible(false); // Ẩn MiniList sau khi chọn
            }}
          />
        </div>
      )}
    </>
  );
};

export default MenuBar;