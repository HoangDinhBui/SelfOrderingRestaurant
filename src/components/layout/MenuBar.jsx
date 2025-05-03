import React, { useState } from "react";
import MiniList from "./MiniList";

const MenuBar = ({
  title = "Management",
  icon = "./src/assets/img/mealicon.png",
  iconStyle = {},
  titleStyle = {},
  isProfilePage = false,
}) => {
  const [isMiniListVisible, setMiniListVisible] = useState(false);
  const [isProfileDropdownVisible, setProfileDropdownVisible] = useState(false);

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
      right: "20px",
      backgroundColor: "white",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      width: "280px",
      zIndex: 110,
      overflow: "hidden",
    },
    profileHeader: {
      padding: "20px",
      textAlign: "center",
      borderBottom: "1px solid #f0f0f0",
    },
    profileAvatarLarge: {
      width: "80px",
      height: "80px",
      borderRadius: "50%",
      objectFit: "cover",
      marginBottom: "10px",
      border: "3px solid #1C2E4A",
    },
    profileName: {
      fontSize: "16px",
      fontWeight: "bold",
      marginBottom: "4px",
    },
    profilePosition: {
      fontSize: "14px",
      color: "#666",
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
    menuItemIcon: {
      width: "20px",
      height: "20px",
      marginRight: "12px",
    },
    profileFooter: {
      display: "flex",
      justifyContent: "space-between",
      padding: "15px 20px",
      borderTop: "1px solid #f0f0f0",
    },
    profileButton: {
      padding: "8px 16px",
      borderRadius: "4px",
      fontWeight: "500",
      cursor: "pointer",
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
    if (isProfilePage) {
      setProfileDropdownVisible(!isProfileDropdownVisible);
      setMiniListVisible(false);
    }
  };

  const handleOverlayClick = () => {
    setMiniListVisible(false);
    setProfileDropdownVisible(false);
  };

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

{isProfilePage && isProfileDropdownVisible && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          width: '180px',
          zIndex: 1000,
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button 
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#333',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Profile
          </button>
          
          <button 
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#333',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            Log out
          </button>
        </div>
      )}
      </div>

      {(isMiniListVisible || isProfileDropdownVisible) && (
        <div style={styles.overlay} onClick={handleOverlayClick} />
      )}

      {isMiniListVisible && (
        <div style={styles.miniListContainer}>
          <MiniList
            items={[
              { label: "Table Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/table.png" },
              { label: "Notification Management", icon: "https://img.icons8.com/material-outlined/192/1C2E4A/alarm.png" },
              { label: "Dish Management", icon: "https://img.icons8.com/?size=100&id=99345&format=png&color=1C2E4A" },
              { label: "Order History", icon: "https://img.icons8.com/?size=100&id=24874&format=png&color=1C2E4A" },
              { label: "Menu Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/menu.png" },
              { label: "Staff Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/user.png" },
              { label: "Revenue Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/money.png" },
              { label: "Evaluate", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/bookmark.png" },
            ]}
            onSelect={(item) => {
              console.log("Selected:", item);
              setMiniListVisible(false);
            }}
          />
        </div>
      )}
    </>
  );
};

export default MenuBar;