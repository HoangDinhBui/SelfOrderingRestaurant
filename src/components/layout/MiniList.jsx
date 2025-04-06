import React, { useState } from "react";

const MiniList = ({ items, onSelect }) => {
  const [selectedItem, setSelectedItem] = useState(null); // Trạng thái để theo dõi mục được chọn
  const [hoveredItem, setHoveredItem] = useState(null); // Trạng thái để theo dõi mục đang hover

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#EAF3FC", // Màu nền nhạt
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
        ? "#1C2E4A" // Màu nền khi được chọn
        : isHovered
        ? "#1C2E4A" // Màu nền khi hover
        : "#FFFFFF", // Màu nền mặc định
      color: isSelected
        ? "#FFFFFF" // Màu chữ khi được chọn
        : isHovered
        ? "#FFFFFF" // Màu chữ khi hover
        : "#8D9EC5", // Màu chữ mặc định
      cursor: "pointer",
      fontWeight: isSelected ? "bold" : "normal",
      transition: "background-color 0.3s, color 0.3s", // Hiệu ứng chuyển đổi màu
      border: "1px solid #9DC6CE", // Đường viền nhẹ
    }),
    icon: (isSelected, isHovered) => ({
      width: "24px",
      height: "24px",
      marginRight: "10px",
      filter: isSelected
        ? "invert(100%)" // Màu trắng khi được chọn
        : isHovered
        ? "invert(100%)" // Màu giống chữ khi hover
        : "invert(50%) sepia(20%) saturate(300%) hue-rotate(180deg)", // Màu mặc định
      transition: "filter 0.3s", // Hiệu ứng chuyển đổi màu icon
    }),
    text: {
      flex: 1,
      fontSize: "16px", // Kích thước chữ
    },
  };

  const handleItemClick = (item) => {
    setSelectedItem(item); // Cập nhật mục được chọn
    if (onSelect) {
      onSelect(item); // Gọi callback khi chọn mục
    }
  };

  const handleMouseEnter = (item) => {
    setHoveredItem(item); // Cập nhật mục đang hover
  };

  const handleMouseLeave = () => {
    setHoveredItem(null); // Xóa trạng thái hover khi chuột rời đi
  };

  return (
    <div style={styles.container}>
      {items.map((item, index) => (
        <div
          key={index}
          style={styles.item(selectedItem === item.label, hoveredItem === item.label)} // Kiểm tra trạng thái chọn và hover
          onClick={() => handleItemClick(item.label)} // Xử lý khi nhấn vào mục
          onMouseEnter={() => handleMouseEnter(item.label)} // Xử lý khi chuột di vào
          onMouseLeave={handleMouseLeave} // Xử lý khi chuột rời đi
        >
          <img
            src={item.icon}
            alt={item.label}
            style={styles.icon(selectedItem === item.label, hoveredItem === item.label)} // Cập nhật màu icon
          />
          <div style={styles.text}>{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default MiniList;