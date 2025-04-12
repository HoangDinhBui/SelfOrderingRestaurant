import React, { useState } from "react";
import MiniList from "./MiniList";

const MenuBar = ({
  title = "Management",
  icon = "./src/assets/img/mealicon.png",
  onMenuSelect,
  onProfileClick,
  onLogoutClick,
}) => {
  const [isMiniListVisible, setMiniListVisible] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
      position: "relative",
      zIndex: 100,
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
      
      padding: "10px",
      height: "100%",
      marginLeft: "15px",
      flex: 1,
    },
    menuIcon: {
      width: "45px",
      height: "40px",
      marginRight: "10px",
      padding: "5px",
      cursor: "pointer",
    },
    menuTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "white",
    },
    menuAvatar: {
      width: "40px",
      height: "40px",
      objectFit: "cover",
      borderRadius: "50%",
      border: "2px solid white",
      cursor: "pointer",
    },
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      zIndex: 90,
    },
    miniListContainer: {
      position: "absolute",
      top: "70px",
      left: "10px",
      zIndex: 110,
    },
    profileMenu: {
      position: "absolute",
      top: "60px",
      right: "10px",
      backgroundColor: "white",
      borderRadius: "5px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
      zIndex: 110,
      width: "150px",
      padding: "10px",
    },
    menuItem: {
      padding: "8px 12px",
      cursor: "pointer",
      color: "#333",
      fontSize: "14px",
      "&:hover": {
        backgroundColor: "#f5f5f5",
      },
    },
  };

  const handleToggleMiniList = (e) => {
    e.stopPropagation();
    setMiniListVisible(!isMiniListVisible);
    setIsProfileMenuOpen(false);
  };

  const handleOverlayClick = () => {
    setMiniListVisible(false);
    setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = (e) => {
    e.stopPropagation();
    setIsProfileMenuOpen(!isProfileMenuOpen);
    setMiniListVisible(false);
  };

  const handleMenuSelect = (item) => {
    setMiniListVisible(false);
    if (onMenuSelect) {
      onMenuSelect(item);
    }
  };

  const handleProfileClick = () => {
    setIsProfileMenuOpen(false);
    if (onProfileClick) onProfileClick();
  };

  const handleLogoutClick = () => {
    setIsProfileMenuOpen(false);
    if (onLogoutClick) onLogoutClick();
  };

  const menuItems = [
    { label: "Table Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/table.png" },
    { label: "Menu Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/menu.png" },
    { label: "Staff Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/user.png" },
    { label: "Revenue Management", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/money.png" },
    { label: "Evaluate", icon: "https://img.icons8.com/ios-filled/50/1C2E4A/bookmark.png" },
  ];

  return (
    <>
      <div style={styles.menuBar}>
        {/* Menu icon */}
        <div onClick={handleToggleMiniList} style={{ cursor: "pointer" }}>
          <img
            src="./src/assets/img/listicon.png"
            alt="Menu"
            style={styles.menuIcon}
          />
        </div>

        {/* Title section */}
        <div style={styles.menuLeft}>
          <div style={styles.menuTitleContainer}>
            <img src={icon} alt="Icon" style={styles.menuIcon} />
            <div style={styles.menuTitle}>
              <i>{title}</i>
            </div>
          </div>
        </div>

        {/* Avatar with dropdown menu */}
        <div style={{ position: "relative" }}>
          <img
            src="./src/assets/img/MyDung.jpg"
            alt="Avatar"
            style={styles.menuAvatar}
            onClick={toggleProfileMenu}
          />
          {isProfileMenuOpen && (
            <div style={styles.profileMenu}>
              <div style={styles.menuItem} onClick={handleProfileClick}>
                Profile
              </div>
              <div style={styles.menuItem} onClick={handleLogoutClick}>
                Log out
              </div>
            </div>
          )}
        </div>

        {/* MiniList */}
        {isMiniListVisible && (
          <div style={styles.miniListContainer}>
            <MiniList items={menuItems} onSelect={handleMenuSelect} />
          </div>
        )}
      </div>

      {/* Overlay */}
      {(isMiniListVisible || isProfileMenuOpen) && (
        <div style={styles.overlay} onClick={handleOverlayClick} />
      )}
    </>
  );
};

export default MenuBar;