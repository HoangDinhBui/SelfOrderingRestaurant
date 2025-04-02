import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Order = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Huîtres Fraiches (6PCS)",
      price: 25.34,
      quantity: 2,
      image: "/src/assets/img/Mon1.jpg",
    },
    {
      id: 2,
      name: "Huîtres Gratinées (6PCS)",
      price: 25.73,
      quantity: 1,
      image: "/src/assets/img/Mon2.jpg",
    },
    {
      id: 3,
      name: "Tartare De Saumon",
      price: 14.03,
      quantity: 3,
      image: "/src/assets/img/Mon3.jpg",
    },
  ]);

  const [showModal, setShowModal] = useState(false); // State để điều khiển modal
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Tính tổng tiền
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  // Xử lý tăng/giảm số lượng
  const updateQuantity = (id, delta) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
    );
  };

  // Xử lý xóa món ăn
  const removeItem = (id) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // Xử lý khi nhấn "YES" trong modal
  const handleConfirmOrder = () => {
    setShowModal(false); // Đóng modal
    setShowConfirmation(true); // Hiển thị bảng mới
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      {/* Header */}
      
      {/* Input Search */}
      <div className="container mx-auto p-4">
        <input
          type="text"
          placeholder="Search"
          className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Nút Menu và Home */}
        <div className="flex justify-between mt-4">
          {/* Nút Menu */}
          <button
            onClick={() => navigate("/menu")} // Điều hướng về trang Menu
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center !font-bold "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4 mr-1"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Menu
          </button>

          {/* Nút Home */}
          <button
            onClick={() => navigate("/")} // Điều hướng về trang Home
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center !font-bold"
          >
            Home
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-4 h-4 ml-1"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l10 10M7 17L17 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Danh sách món ăn đã chọn */}
      <div className="container mx-auto px-4 mb-4">
        <div className="flex space-x-6 overflow-x-auto">
          {cartItems.map((item) => (
            <div key={item.id} className="flex flex-col items-center">
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 rounded-full object-cover border border-gray-300"
              />
              <p className="text-sm text-center mt-2 font-medium">{item.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bill */}
      <div className="container mx-auto p-4 flex flex-col items-center">
        <div className="flex items-center w-full max-w-2xl mb-4">
          {/* Nút mũi tên quay lại */}
          <button
            onClick={() => navigate("/menu")}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 mr-2"
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
          {/* Tiêu đề Bill */}
          <h2 className="text-xl font-bold">Bill</h2>
        </div>

        <div className="space-y-4 w-full max-w-2xl">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm flex items-start">
              {/* Ảnh món ăn */}
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-lg"
              />

              {/* Thông tin món ăn */}
              <div className="flex-1 ml-4">
                {/* Dòng trên: Tên, giá và nút xóa */}
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg text-left">{item.name}</h3>
                    <p className="text-gray-500 text-lg text-left">${item.price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="!bg-gray-200 text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Dòng dưới: Số lượng và nút Note */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="!bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className=" text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="!bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => navigate(`/note/${item.id}`, { state: { name: item.name } })} // Truyền tên món ăn qua state
                    className="!bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                  >
                    Note
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tổng tiền */}
        <div className="mt-6 flex justify-between items-center w-full max-w-2xl">
          {/* Nút Order */}
          <button
            onClick={() => setShowModal(true)} // Hiển thị modal khi nhấn Order
            className="!bg-red-500 text-white py-2 px-6 rounded-lg flex items-center hover:bg-red-600"
          >
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
          {/* Tổng giá */}
          <div className="border border-gray-300 rounded-lg px-4 py-2 bg-white flex items-center">
            <p className="text-lg font-bold">${totalPrice.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0  bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white p-6 rounded-lg shadow-lg w-96 border border-gray-300">
            {/* Nút đóng modal */}
            <button
              onClick={() => setShowModal(false)} // Đóng modal
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Nội dung modal */}
            <img
              src="/src/assets/img/logo.jpg" // Đường dẫn đến logo
              alt="Restaurant Logo"
              className="mx-auto mb-4 w-50 h-50 object-contain" // Căn giữa và chỉnh kích thước logo
            />
            <p className="text-center text-gray-700 mb-6">
              ARE YOU SURE YOU WANT TO ORDER THESE DISHES?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleConfirmOrder}
                className="!bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
              >
                YES
              </button>
              <button
                onClick={() => setShowModal(false)} // Đóng modal
                className="!bg-gray-200 border border-black text-black px-6 py-2 rounded-lg hover:bg-gray-200"
              >
                NO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bảng mới */}
      {showConfirmation && (
        <div className="fixed inset-0  bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white p-6 rounded-lg shadow-lg w-96 border border-gray-300">
            {/* Nút đóng modal */}
            <button
              onClick={() => setShowConfirmation(false)} // Đóng modal
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src="/src/assets/img/logo.jpg" // Đường dẫn đến logo
              alt="Restaurant Logo"
              className="mx-auto mb-4 w-50 h-50 object-contain" // Căn giữa và chỉnh kích thước logo
            />
            <p className="text-center text-gray-700 mb-6">
              WE HAVE RECEIVED YOUR PAYMENT REQUEST, PLEASE WAIT A MOMENT
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;