import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import MiniList from "./MiniList";

const MenuBar = ({
  title = "Profile",
  icon = "./src/assets/img/mealicon.png",
  iconStyle = {},
  titleStyle = {},
  isProfilePage = false,
}) => {
  const [isMiniListVisible, setMiniListVisible] = useState(false);
  const [isProfileDropdownVisible, setProfileDropdownVisible] = useState(false);
  const navigate = useNavigate();

  // Giả định userType được lấy từ localStorage hoặc context
  const userType = localStorage.getItem("userType") || null; // Thay bằng logic context nếu cần

  const styles = {
    menuBar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#8D9EC5",
      color: "white",
      padding: "10px 20px",
      width: "100%",
      height: "60px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.33)",
      position: "relative",
      zIndex: 100,
    },
    menuLeft: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
    },
    menuTitleContainer: {
      display: "flex",
      alignItems: "center",
      backgroundColor: "#1C2E4A",
      padding: "10px 15px",
      height: "100%",
      borderRadius: "4px",
    },
    menuIcon: {
      width: "30px",
      height: "30px",
      cursor: "pointer",
      ...iconStyle,
    },
    menuTitle: {
      fontSize: "18px",
      fontWeight: "bold",
      marginLeft: "10px",
      ...titleStyle,
    },
    menuAvatar: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      border: "2px solid white",
      cursor: "pointer",
      objectFit: "cover",
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      zIndex: 90,
    },
    miniListContainer: {
      position: "absolute",
      top: "70px",
      left: "20px",
      zIndex: 100,
    },
    profileDropdown: {
      position: "absolute",
      top: "70px",
      right: "55px",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      width: "280px",
      zIndex: 110,
      overflow: "hidden",
    },
    profileMenu: {
      padding: "10px 0",
    },
    profileMenuItem: {
      display: "flex",
      alignItems: "center",
      padding: "12px 20px",
      cursor: "pointer",
      transition: "background-color 0.2s",
      "&:hover": {
        backgroundColor: "#f5f5f5",
      },
    },
    profileButton: {
      padding: "12px 16px",
      borderRadius: "4px",
      fontWeight: "500",
      cursor: "pointer",
      width: "100%",
      boxSizing: "border-box",
    },
    viewProfileButton: {
      backgroundColor: "#1C2E4A",
      color: "white",
      border: "none",
    },
    logoutButton: {
      backgroundColor: "transparent",
      color: "#ff4d4f",
      border: "1px solid #ff4d4f",
    },
  };

  const handleToggleMiniList = () => {
    setMiniListVisible(!isMiniListVisible);
    setProfileDropdownVisible(false);
  };

  const handleToggleProfileDropdown = () => {
    setProfileDropdownVisible(!isProfileDropdownVisible);
    setMiniListVisible(false);
  };

  const handleOverlayClick = () => {
    setMiniListVisible(false);
    setProfileDropdownVisible(false);
  };

  const handleLogout = () => {
    console.log("handleLogout: Clicked logout button");
    console.log("localStorage before navigation:", {
      accessToken: localStorage.getItem("accessToken"),
      username: localStorage.getItem("username"),
      userType: localStorage.getItem("userType"),
      refreshToken: localStorage.getItem("refreshToken"),
      staffId: localStorage.getItem("staffId"),
    });

    if (userType === "STAFF") {
      toast.info("Proceeding to check-out.");
      console.log("Navigating to /check-out");
      navigate("/check-out", { replace: true });

      setTimeout(() => {
        console.log(
          "Fallback navigation check: current path =",
          window.location.pathname
        );
        console.log("localStorage after navigation attempt:", {
          accessToken: localStorage.getItem("accessToken"),
          username: localStorage.getItem("username"),
          userType: localStorage.getItem("userType"),
          refreshToken: localStorage.getItem("refreshToken"),
          staffId: localStorage.getItem("staffId"),
        });
        if (window.location.pathname !== "/check-out") {
          console.log("Forcing navigation to /check-out");
          window.location.replace("/check-out");
        }
      }, 200);
    } else if (userType === "ADMIN") {
      console.log("Logging out directly for ADMIN");
      localStorage.removeItem("userType");
      toast.info("Logged out successfully.");
      navigate("/login", { replace: true });
    } else {
      console.log("No valid userType, redirecting to login");
      toast.warn("Please log in again.");
      navigate("/login", { replace: true });
    }
  };

  const handleViewProfile = () => {
    if (!userType) {
      navigate("/login");
      return;
    }
    if (userType === "STAFF") {
      navigate("/staff-information_staff");
    } else if (userType === "ADMIN") {
      navigate("/admin-information_admin");
    } else {
      navigate("/login");
    }
  };

  const menuItems = [
    {
      label: "Table Management",
      icon: "https://img.icons8.com/ios-filled/50/1C2E4A/table.png",
      path:
        userType === "STAFF"
          ? "/table-management_staff"
          : "/table-management_admin",
    },
    {
      label: "Notification Management",
      icon: "https://img.icons8.com/material-outlined/192/1C2E4A/alarm.png",
      path: "/notification-management",
    },
    {
      label: "Dish Management",
      icon: "https://img.icons8.com/?size=100&id=99345&format=png&color=1C2E4A",
      path:
        userType === "STAFF" ? "/dish-management_staff" : "/dish-management",
    },
    {
      label: "Order History",
      icon: "https://img.icons8.com/?size=100&id=24874&format=png&color=1C2E4A",
      path: "/order-history",
    },
    {
      label: "Menu Management",
      icon: "https://img.icons8.com/ios-filled/50/1C2E4A/menu.png",
      path: "/menu-management_admin",
    },
    {
      label: "Staff Management",
      icon: "https://img.icons8.com/ios-filled/50/1C2E4A/user.png",
      path: "/staff-management_admin",
    },
    {
      label: "Revenue Management",
      icon: "https://img.icons8.com/ios-filled/50/1C2E4A/money.png",
      path: "/revenue-management_admin",
    },
    {
      label: "Evaluate",
      icon: "https://img.icons8.com/ios-filled/50/1C2E4A/bookmark.png",
      path: "/evaluate_admin",
    },
    {
      label: "Inventory Management",
      icon: "https://img.icons8.com/?size=100&id=4NUeu__UwtXf&format=png&color=1C2E4A",
      path: "/inventory-management_admin",
    },
  ];

  return (
    <>
      <div style={styles.menuBar}>
        <div style={styles.menuLeft}>
          <img
            src="./src/assets/img/listicon.png"
            alt="Menu"
            style={styles.menuIcon}
            onClick={handleToggleMiniList}
          />
          <div style={styles.menuTitleContainer}>
            <img src={icon} alt="Icon" style={styles.menuIcon} />
            <span style={styles.menuTitle}>{title}</span>
          </div>
        </div>

        <img
          src="./src/assets/img/MyDung.jpg"
          alt="User Avatar"
          style={styles.menuAvatar}
          onClick={handleToggleProfileDropdown}
        />

        {isProfileDropdownVisible && (
          <div style={styles.profileDropdown}>
            <div style={styles.profileMenu}>
              <div style={styles.profileMenuItem}>
                <button
                  style={{
                    ...styles.profileButton,
                    ...styles.viewProfileButton,
                    textAlign: "left",
                  }}
                  onClick={handleViewProfile}
                >
                  Profile
                </button>
              </div>
              <div style={styles.profileMenuItem}>
                <button
                  style={{
                    ...styles.profileButton,
                    ...styles.logoutButton,
                    textAlign: "left",
                  }}
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {(isMiniListVisible || isProfileDropdownVisible) && (
        <div style={styles.overlay} onClick={handleOverlayClick} />
      )}

      {isMiniListVisible && (
        <div style={styles.miniListContainer}>
          <MiniList
            items={menuItems}
            onSelect={(item) => {
              navigate(item.path);
              setMiniListVisible(false);
            }}
          />
        </div>
      )}
    </>
  );
};

export default MenuBar;