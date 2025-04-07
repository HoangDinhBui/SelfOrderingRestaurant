import React, { useState } from "react";
import MiniList from "./MiniList";

const MenuBar = ({
  title = "Management",
  icon = "./src/assets/img/mealicon.png",
  iconStyle = {}, // Style tùy chỉnh cho icon
  titleStyle = {}, // Style tùy chỉnh cho title
}) => {
  const [isMiniListVisible, setMiniListVisible] = useState(false);

  const styles = {
    menuBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#8D9EC5",
      color: "white",
      padding: "10px",
      width: "100%",
      height: "60px",
      zIndex: 2,
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.33)",
    },
    menuLeft: {
      display: "flex",
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
      width: "45px",
      height: "40px",
      marginRight: "10px",
      padding: "5px",
      cursor: "pointer",
      ...iconStyle, // Áp dụng style tùy chỉnh cho icon
    },
    menuTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "white",
      ...titleStyle, // Áp dụng style tùy chỉnh cho title
    },
    menuAvatar: {
      width: "40px",
      height: "40px",
      objectFit: "cover",
      borderRadius: "50%",
      border: "2px solid white",
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      zIndex: 1,
    },
    miniListContainer: {
      position: "absolute",
      top: "80px",
      left: "20px",
      zIndex: 2,
    },
  };

  const handleToggleMiniList = () => {
    setMiniListVisible(!isMiniListVisible);
  };

  const handleOverlayClick = () => {
    setMiniListVisible(false);
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
            onClick={handleToggleMiniList}
          />
          <div style={styles.menuTitleContainer}>
            <img
              src={icon} // Sử dụng icon từ props
              alt="Icon"
              style={styles.menuIcon}
            />
            <div style={styles.menuTitle}>
              <i>{title}</i> {/* Sử dụng title từ props */}
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
            items={[
              { label: "Table Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/table.png" },
              { label: "Menu Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/menu.png" },
              { label: "Staff Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/user.png" },
              { label: "Revenue Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/money.png" },
              { label: "Evaluate", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/bookmark.png" },
            ]}
            onSelect={(item) => {
              console.log("Selected item:", item);
              setMiniListVisible(false);
            }}
          />
        </div>
      )}
    </>
  );
};

export default MenuBar;