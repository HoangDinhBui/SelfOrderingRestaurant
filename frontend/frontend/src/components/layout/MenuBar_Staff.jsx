import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const MenuBarStaff = () => {
  const [activeContainer, setActiveContainer] = useState(null);
  const navigate = useNavigate();

  const styles = {
    menuBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#8D9EC5",
      color: "white",
      padding: "0 20px",
      width: "100%",
      height: "60px",
    },
    menuLeft: {
      display: "flex",
      alignItems: "center",
    },
    menuTitleContainer: (isActive) => ({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isActive ? "#1C2E4A" : "#8D9EC5",
      padding: "10px",
      height: "100%",
      marginLeft: "15px",
      cursor: "pointer",
    }),
    menuIcon: {
      width: "40px",
      height: "40px",
      marginRight: "10px",
    },
    menuTitle: (isActive) => ({
      fontSize: "18px",
      fontWeight: "bold",
      color: isActive ? "white" : "#1C2E4A",
    }),
    menuAvatar: {
      width: "50px",
      height: "50px",
      objectFit: "cover",
      borderRadius: "50%",
    },
  };

  const handleNavigation = (container, path) => {
    setActiveContainer(container);
    navigate(path);
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
          style={styles.menuTitleContainer(activeContainer === "order")}
          onClick={() => handleNavigation("order", "/table-management")}
        >
          <img
            src="https://img.icons8.com/ios-filled/50/FFFFFF/table.png"
            alt="Table icon"
            style={styles.menuIcon}
          />
          <div style={styles.menuTitle(activeContainer === "order")}>
            <i>Table Management</i>
          </div>
        </div>

        <div
          style={styles.menuTitleContainer(activeContainer === "notification")}
          onClick={() =>
            handleNavigation("notification", "/notification-management")
          }
        >
          <img
            src="https://img.icons8.com/material-outlined/192/FFFFFF/alarm.png"
            alt="Alarm icon"
            style={styles.menuIcon}
          />
          <div style={styles.menuTitle(activeContainer === "notification")}>
            <i>Notification Management</i>
          </div>
        </div>

        <div
          style={styles.menuTitleContainer(activeContainer === "dish")}
          onClick={() => handleNavigation("dish", "/dish-management")}
        >
          <img
            src="./src/assets/img/mealicon.png"
            alt="Meal icon"
            style={styles.menuIcon}
          />
          <div style={styles.menuTitle(activeContainer === "dish")}>
            <i>Dish Management</i>
          </div>
        </div>

        <div
          style={styles.menuTitleContainer(activeContainer === "history")}
          onClick={() => handleNavigation("history", "/order-history")}
        >
          <img
            src="https://img.icons8.com/?size=100&id=24874&format=png&color=FFFFFF"
            alt="History icon"
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