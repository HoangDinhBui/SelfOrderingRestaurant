import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

const ViewItem = () => {
  const { id } = useParams(); // Lấy id từ URL
  const navigate = useNavigate();

  // Dữ liệu mẫu (thay bằng API hoặc state thực tế)
  const menuItems = [
    {
      id: 1,
      name: "Huîtres Fraiches (6PCS)",
      price: 25.34,
      quantity: 1,
      image: "/src/assets/img/Mon1.jpg",
      description: "Imported French Oyster | 6 Pcs Served Natural | Mignonette Sauce",
      rating: 5.0,
      category: "Appetizers",
      sold: 199,
      stock: 250,
    },
    {
      id: 2,
      name: "Huîtres Gratinées (6PCS)",
      price: 25.73,
      quantity: 1,
      image: "/src/assets/img/Mon2.jpg",
      description: "Baked French Oyster | 6 Pcs with Cheese | Garlic Butter Sauce",
      rating: 4.8,
      category: "Appetizers",
      sold: 150,
      stock: 200,
    },
    {
      id: 3,
      name: "Tartare De Saumon",
      price: 14.03,
      quantity: 1,
      image: "/src/assets/img/Mon3.jpg",
      description: "Fresh Salmon Tartare | Lemon | Dill | Capers",
      rating: 4.9,
      category: "Main Course",
      sold: 120,
      stock: 180,
    },
  ];

  // Lấy thông tin món ăn dựa trên id
  const item = menuItems.find((menuItem) => menuItem.id === parseInt(id));

  const [quantity, setQuantity] = useState(item.quantity);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="bg-white py-3 shadow-md sticky top-0 z-10 flex items-center px-4">
        <button
          onClick={() => navigate("/menu")}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center">View</h2>
      </div>

      {/* Nội dung chi tiết món ăn */}
      <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
        {/* Ảnh món ăn */}
        <img src={item.image} alt={item.name} className="w-full h-64 object-cover rounded-lg" />

        {/* Tên và giá */}
        <div className="flex justify-between items-center mt-4">
          <h3 className="font-bold text-xl">{item.name}</h3>
          <p className="text-gray-500 text-lg">${item.price.toFixed(2)}</p>
        </div>

        {/* Số lượng đã bán và tồn kho */}
        <div className="flex justify-between items-center mt-2">
            <div className="mt-2">
            {/* Số lượng đã bán và tồn kho */}
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-black">{item.sold}</span>
                    <span className="text-gray-400">{item.stock}</span>
                </div>

                {/* Đánh giá và danh mục */}
                <div className="flex items-center space-x-2 mt-1">
                    <span className="text-yellow-500 text-lg">⭐</span>
                    <span className="text-sm font-medium">{item.rating}</span>
                    <span className="text-sm text-gray-600">{item.category}</span>
                </div>
            </div>
            <button
              onClick={() => navigate(`/note/${id}`, { state: { name: item.name } })} // Truyền tên món ăn qua state
              className="!bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Note
            </button>
        </div>

        {/* Mô tả */}
        <p className="text-sm text-gray-600 mt-4">{item.description}</p>

        {/* Số lượng, tổng giá và nút Order */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              className="!bg-gray-400 px-2 py-1 rounded hover:bg-gray-300"
            >
              -
            </button>
            <span className="text-lg">{quantity}</span>
            <button
              onClick={() => setQuantity((prev) => prev + 1)}
              className="!bg-gray-400 px-2 py-1 rounded hover:bg-gray-300"
            >
              +
            </button>
          </div>
          <p className="font-bold text-lg">${(item.price * quantity).toFixed(2)}</p>
          <button className="!bg-red-400 text-white py-2 px-6 rounded-lg flex items-center">
            Order
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewItem;