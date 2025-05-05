import React, { useState } from "react";

const MiniList = ({ items, onSelect }) => {
  const [selectedItem, setSelectedItem] = useState(null); // Track selected item
  const [hoveredItem, setHoveredItem] = useState(null); // Track hovered item

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#EAF3FC", // Light background
      border: "1px solid #9DC6CE",
      borderRadius: "10px",
      width: "250px",
      padding: "10px",
      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    },
    item: (isSelected, isHovered) => ({
      display: "flex",
      alignItems: "center",
      padding: "15px",
      margin: "5px 0",
      borderRadius: "5px",
      backgroundColor: isSelected
        ? "#1C2E4A" // Selected background
        : isHovered
        ? "#1C2E4A" // Hovered background
        : "#FFFFFF", // Default background
      color: isSelected
        ? "#FFFFFF" // Selected text color
        : isHovered
        ? "#FFFFFF" // Hovered text color
        : "#8D9EC5", // Default text color
      cursor: "pointer",
      fontWeight: isSelected ? "bold" : "normal",
      transition: "background-color 0.3s, color 0.3s", // Smooth color transition
      border: "1px solid #9DC6CE", // Light border
    }),
    icon: (isSelected, isHovered) => ({
      width: "24px",
      height: "24px",
      marginRight: "10px",
      filter: isSelected
        ? "invert(100%)" // White icon when selected
        : isHovered
        ? "invert(100%)" // White icon when hovered
        : "invert(50%) sepia(20%) saturate(300%) hue-rotate(180deg)", // Default icon color
      transition: "filter 0.3s", // Smooth icon color transition
    }),
    text: {
      flex: 1,
      fontSize: "16px", // Text size
    },
  };

  const handleItemClick = (item) => {
    setSelectedItem(item); // Update selected item
    if (onSelect) {
      onSelect(item); // Call callback with entire item object
    }
  };

  const handleMouseEnter = (item) => {
    setHoveredItem(item); // Update hovered item
  };

  const handleMouseLeave = () => {
    setHoveredItem(null); // Clear hover state
  };

  return (
    <div style={styles.container}>
      {items.map((item, index) => (
        <div
          key={item.path || index} // Use path as key for uniqueness, fallback to index
          style={styles.item(selectedItem === item, hoveredItem === item)} // Check selected/hovered state
          onClick={() => handleItemClick(item)} // Handle click with entire item
          onMouseEnter={() => handleMouseEnter(item)} // Handle mouse enter
          onMouseLeave={handleMouseLeave} // Handle mouse leave
        >
          <img
            src={item.icon}
            alt={item.label}
            style={styles.icon(selectedItem === item, hoveredItem === item)} // Update icon color
          />
          <div style={styles.text}>{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default MiniList;
