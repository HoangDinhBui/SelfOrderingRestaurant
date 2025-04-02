import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Payment = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false); // State để điều khiển modal

  const handlePayment = () => {
    setShowModal(true); // Hiển thị modal khi bấm nút PAYMENT
  };

  

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white py-3 shadow-md fixed top-0 left-0 w-full z-10">
        <div className="flex items-center px-4 w-full">
          <button
            onClick={() => navigate(-1)}
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
          <div className="flex-1 text-center">
            <div className="text-lg font-bold">Payment</div>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Nội dung cuộn được */}
      <div className="flex-1 overflow-y-auto mt-[64px] p-4">
        {/* Order Bill */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <h2 className="text-lg font-bold mb-4">ORDER BILL</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">ORDER ID</span>
              <span>#1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">TABLE NO.</span>
              <span>#1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ORDER DATE</span>
              <span>2025/03/24</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PAYMENT STATUS</span>
              <span className="text-red-500">UNPAID</span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <h2 className="text-lg font-bold mb-4">ITEMS LIST</h2>
          <div className="grid grid-cols-3 gap-4 text-gray-500 text-sm font-medium border-b pb-2">
            <span>ITEMS</span>
            <span className="text-center">DESCRIPTION</span>
            <span className="text-right">PRICE</span>
          </div>
          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-3 gap-4 items-center">
              <span className="font-bold">Tartare De Saumon</span>
              <span className="text-center">Product name<br />Description<br />Quantity: 01</span>
              <span className="text-right text-red-500">$10.99</span>
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
              <span className="font-bold">Huîtres Fraiches</span>
              <span className="text-center">Product name<br />Description<br />Quantity: 01</span>
              <span className="text-right text-red-500">$8.99</span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
          <div className="space-y-4 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500">COUPON</span>
              <span className="text-red-500">-$2.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PAYMENT METHOD</span>
              <select className="border border-gray-300 rounded-lg px-2 py-1">
                <option value="vnpay">VNPay</option>
                <option value="cash">Cash</option>
                <option value="credit">Credit Card</option>
              </select>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL</span>
              <span>$21.98</span>
            </div>
          </div>

          {/* Payment Button */}
          <button
            className="w-full !bg-black text-white py-3 rounded-lg hover:bg-gray-800"
            onClick={handlePayment}
          >
            PAYMENT
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0  bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white p-6 rounded-lg shadow-lg w-96 border border-gray-300">
            {/* Nút đóng modal */}
            <button
              onClick={() => {
                setShowModal(false); // Đóng modal
                navigate("/evaluate"); // Điều hướng đến trang Evaluate
              }}
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
            WE HAVE RECEIVED YOUR PAYMENT REQUEST, PLEASE WAIT A MOMENT
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Payment;