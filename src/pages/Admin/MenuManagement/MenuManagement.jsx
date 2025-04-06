import React from "react";
import MenuBar from "../../../components/layout/menuBar";

const MenuManagement = () => {
  const dishes = [
    {
      id: "A1",
      name: "Huitres Fraiches (6PSC)",
      price: "$25,35",
      category: "Appetizers",
      image: "huitres1.jpg",
    },
    {
      id: "A2",
      name: "Huitres Gratinees (6PCS)",
      price: "$25,74",
      category: "Appetizers",
      image: "huitres2.jpg",
    },
    {
      id: "A3",
      name: "Tartare De Saumon",
      price: "$14,04",
      category: "Appetizers",
      image: "tartare.jpg",
    },
    {
      id: "A4",
      name: "Salad Gourmande",
      price: "$13,65",
      category: "Appetizers",
      image: "salad1.jpg",
    },
    {
      id: "A5",
      name: "Salad Landaise",
      price: "$12,29",
      category: "Appetizers",
      image: "salad2.jpg",
    },
    {
      id: "M1",
      name: "Magret De Canard",
      price: "$17,55",
      category: "Main",
      image: "magret.jpg",
    },
  ];

  const styles = {
    outerContainer: {
      fontFamily: "Arial, sans-serif",
      backgroundColor: "rgba(73, 91, 95, 0.27)", // Nền màu #9DC6CE với độ mờ 30%
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      padding: "20px",
    },
    innerContainer: {
      backgroundColor: "#F0F8FD",
      borderRadius: "10px",
      padding: "20px",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Đổ bóng nhẹ
      border: "3px solid rgba(0, 0, 0, 0.1)",
    },
    title: {
      textAlign: "center",
      fontSize: "35px",
      fontWeight: "bold",
      marginBottom: "15px",
    },
    tableAndControls: {
      display: "flex",
      alignItems: "flex-start", // Căn các thành phần theo chiều dọc
      gap: "20px", // Khoảng cách giữa bảng và ô tìm kiếm/nút
    },
    searchAndButtonContainer: {
      display: "flex",
      flexDirection: "column", // Đặt các thành phần theo chiều dọc
      alignItems: "flex-end", // Căn sang phải
      gap: "10px", // Khoảng cách giữa các thành phần
    },
    searchRow: {
      display: "flex",
      flexDirection: "row", // Đặt ô tìm kiếm và nút trên cùng một hàng
      alignItems: "center", // Căn giữa theo chiều dọc
      gap: "10px", // Khoảng cách giữa ô tìm kiếm và nút
    },
    input: {
      padding: "10px",
      borderRadius: "5px",
      border: "1px solid #ddd",
      width: "200px",
    },
    addButton: {
      padding: "10px 20px",
      backgroundColor: "#4CAF50",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    chefMouseImage: {
      marginTop: "55px", // Khoảng cách giữa hình ảnh và nút
      width: "280px", // Chiều rộng của hình ảnh
      height: "400px", // Tự động điều chỉnh chiều cao theo tỷ lệ
    },
    tableContainer: {
      flex: 1,
      backgroundColor: "rgba(157, 198, 206, 0.3)", // Nền màu #9DC6CE với độ mờ 30%
      borderRadius: "10px",
      padding: "20px",
      overflowY: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      border: "2px solid #9DC6CE",
    },
    th: {
      backgroundColor: "#9DC6CE",
      fontWeight: "bold",
      border: "1px solid #ddd",
      padding: "10px",
    },
    td: {
      border: "1px solid #9DC6CE",
      padding: "10px",
      textAlign: "center",
    },
    price: {
      color: "#e74c3c",
      fontWeight: "bold",
    },
    oddRow: {
      backgroundColor: "rgba(157, 198, 206, 0.3)", // Màu #9DC6CE với độ mờ 30%
    },
    evenRow: {
      backgroundColor: "#FFFFFF", // Màu trắng
    },
  };

  return (
    <>
      {/* Thanh menu */}
      <MenuBar title="Menu Management"/>

      {/* Container ngoài */}
      <div style={styles.outerContainer}>
        {/* Container bên trong */}
        <div style={styles.innerContainer}>
          {/* Tiêu đề */}
          <h1 style={styles.title}>Menu</h1>

          {/* Bảng và ô tìm kiếm/nút */}
          <div style={styles.tableAndControls}>
            {/* Bảng món ăn */}
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dishes.map((dish, index) => (
                    <tr
                      key={dish.id}
                      style={index % 2 === 0 ? styles.evenRow : styles.oddRow} // Hàng chẵn/trắng, hàng lẻ/mờ
                    >
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <img
                            src={`./src/assets/img/${dish.image}`}
                            alt={dish.name}
                            style={{
                              width: "50px",
                              height: "50px",
                              borderRadius: "5px",
                              marginRight: "10px",
                            }}
                          />
                          {dish.name}
                        </div>
                      </td>
                      <td style={styles.td}>{dish.id}</td>
                      <td style={{ ...styles.td, ...styles.price }}>
                        {dish.price}
                      </td>
                      <td style={styles.td}>{dish.category}</td>
                      <td style={styles.td}>
                        <button
                          style={{ marginRight: "10px", cursor: "pointer" }}
                        >
                          ✏️
                        </button>
                        <button style={{ cursor: "pointer" }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Ô tìm kiếm, nút "+" và hình ảnh */}
            <div style={styles.searchAndButtonContainer}>
              {/* Hàng chứa ô tìm kiếm và nút */}
              <div style={styles.searchRow}>
                <input
                  type="text"
                  placeholder="Search..."
                  style={styles.input}
                />
                <button style={styles.addButton}>+</button>
              </div>
              {/* Hình ảnh Chef Mouse */}
              <img
                src="./src/assets/img/chefmouse.png"
                alt="Chef Mouse"
                style={styles.chefMouseImage}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuManagement;