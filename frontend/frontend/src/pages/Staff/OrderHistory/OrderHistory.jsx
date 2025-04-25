import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheck,
  FaTrash,
  FaMoneyBillWave,
  FaBell,
  FaUtensils,
} from "react-icons/fa";
import MenuBarStaff from "../../../components/layout/MenuBar_Staff.jsx";
import MenuBar from "../../../components/layout/menuBar.jsx";

const OrderHistoryStaff = () => {
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      customer: 1,
      table: "Table 1",
      paymentSlip: 1,
      total: 1000000,
      time: "18:30:00",
      date: "Today",
    },
    {
      id: 2,
      customer: 4,
      table: "Table 4",
      paymentSlip: 2,
      total: 1500000,
      time: "18:30:00",
      date: "Today",
    },
    {
      id: 3,
      customer: 2,
      table: "Table 2",
      paymentSlip: 3,
      total: 1200000,
      time: "18:30:00",
      date: "Today",
    },
    {
      id: 4,
      customer: 3,
      table: "Table 3",
      paymentSlip: 4,
      total: 1300000,
      time: "18:30:00",
      date: "Today",
    },
    {
      id: 5,
      customer: 2,
      table: "Table 2",
      paymentSlip: 5,
      total: 1500000,
      time: "18:30:00",
      date: "12/04/2025",
    },
  ]);

  const mockDishes = {
    1: [
      { name: "Phở Bò", quantity: 2, price: 50000, note: "-" },
      { name: "Nước Ngọt", quantity: 1, price: 20000, note: "Không đá" },
    ],
    2: [
      { name: "Cơm Tấm", quantity: 3, price: 40000, note: "-" },
      { name: "Trà Đá", quantity: 2, price: 10000, note: "-" },
    ],
    3: [
      { name: "Bún Chả", quantity: 2, price: 45000, note: "-" },
      { name: "Nước Mía", quantity: 1, price: 15000, note: "-" },
    ],
    4: [
      { name: "Hủ Tiếu", quantity: 2, price: 35000, note: "Ít hành" },
      { name: "Cà Phê", quantity: 1, price: 20000, note: "-" },
    ],
    5: [
      { name: "Bánh Mì", quantity: 3, price: 30000, note: "-" },
      { name: "Sữa Tươi", quantity: 2, price: 15000, note: "-" },
    ],
  };

  const handleViewBill = (notification) => {
    const tableData = {
      id: notification.table,
      dishes: mockDishes[notification.id] || [],
    };
    setSelectedTable(tableData);
    setTotalAmount(notification.total);
    setIsBillModalOpen(true);
  };

  const handlePrintBill = () => {
    setIsPrintModalOpen(true);
  };

  const handlePrintReceipt = () => {
    setIsBillModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  const handleConfirmPrint = () => {
    console.log("Printing bill...");
    setIsPrintModalOpen(false);
  };

  const handleCancelPrint = () => {
    setIsPrintModalOpen(false);
  };

  const tabs = ["Order Management", "Notification Management", "Dish Management"];
  const navigate = useNavigate();

  const groupedNotifications = notifications.reduce((acc, notification) => {
    if (!acc[notification.date]) {
      acc[notification.date] = [];
    }
    acc[notification.date].push(notification);
    return acc;
  }, {});

  const handleTabClick = (tab) => {
    if (tab === "Order Management") {
      navigate("/order-management");
    } else if (tab === "Dish Management") {
      navigate("/dish-management");
    }
  };

  const handleCheckNotification = (id) => {
    setNotifications(
      notifications.map((noti) =>
        noti.id === id ? { ...noti, checked: true } : noti
      )
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "Payment request":
        return <FaMoneyBillWave className="text-green-500 mr-2" />;
      case "Call staff":
        return <FaBell className="text-blue-500 mr-2" />;
      case "Other":
        return <FaUtensils className="text-orange-500 mr-2" />;
      default:
        return <FaBell className="text-gray-500 mr-2" />;
    }
  };

  const isModalOpen = isBillModalOpen || isPrintModalOpen;

  return (
    <div className="h-screen w-screen !bg-blue-50 flex flex-col">
      <div className={isModalOpen ? "blur-sm" : ""}>
        <MenuBarStaff />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 p-6 bg-gray-100 overflow-y-auto ${
          isModalOpen ? "blur-sm" : ""
        }`}
      >
        {/* Notification List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {Object.entries(groupedNotifications).map(
            ([date, dateNotifications]) => (
              <div key={date} className="mb-8">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">{date}</h2>
                {dateNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="relative flex justify-between items-center bg-white rounded-lg shadow-md p-4 mb-4"
                  >
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-15 h-15 bg-gray-200 rounded-full mr-4">
                        Table {notification.paymentSlip}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          Customer {notification.customer}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          - Payment slip: {notification.paymentSlip} <br />
                          - Total: {notification.total.toLocaleString()} VND
                        </p>
                      </div>
                    </div>

                    <span className="absolute top-2 right-4 text-gray-500 text-sm">
                      {notification.time}
                    </span>

                    <div className="flex justify-end space-x-4">
                      <button
                        className="flex items-center px-3 py-1 !bg-[#49B02D] text-white rounded hover:bg-green-600"
                        onClick={() => handleViewBill(notification)}
                      >
                        View
                      </button>
                      <button
                        className="flex items-center px-3 py-1 !bg-[#3F26B9] text-white rounded hover:bg-blue-700"
                        onClick={handlePrintBill}
                      >
                        <FaTrash className="mr-1" /> Print
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {isBillModalOpen && selectedTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsBillModalOpen(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-xl p-6 w-2/3 relative z-50">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                450 Le Van Viet Street, Tang Nhon Phu A Ward, District 9
              </p>
              <p className="text-sm text-gray-600">Phone: 0987654321</p>
              <h3 className="font-bold mt-2 text-xl text-blue-800">
                Payment Slip {selectedTable.id.split(" ")[1].padStart(3, "0")}
              </h3>
            </div>

            <div className="flex justify-between border-b pb-2 mb-4">
              <span className="font-bold text-gray-700">{selectedTable.id}</span>
              <span className="font-bold text-gray-700">
                Payment Slip {selectedTable.id.split(" ")[1].padStart(3, "0")}
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto mb-4">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-gray-700">
                      Dish name
                    </th>
                    <th className="text-left py-2 font-medium text-gray-700">
                      Qty
                    </th>
                    <th className="text-left py-2 font-medium text-gray-700">
                      Unit price
                    </th>
                    <th className="text-left py-2 font-medium text-gray-700">
                      Total amount
                    </th>
                    <th className="text-left py-2 font-medium text-gray-700">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTable.dishes.map((dish, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 text-gray-800">{dish.name}</td>
                      <td className="py-3">{dish.quantity}</td>
                      <td className="py-3">
                        {dish.price ? dish.price.toLocaleString() : "-"} VND
                      </td>
                      <td className="py-3 font-medium">
                        {dish.price
                          ? (dish.price * dish.quantity).toLocaleString()
                          : "-"} VND
                      </td>
                      <td className="py-3 text-gray-500">{dish.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between mt-4 border-t pt-4">
              <span className="font-bold text-gray-700">Staff: 1</span>
              <span className="font-bold text-lg text-blue-800">
                Total Amount: {totalAmount.toLocaleString()} VND
              </span>
            </div>

            <div className="mt-6 flex justify-center space-x-4">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                onClick={() => setIsBillModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="!bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                onClick={handlePrintReceipt}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsPrintModalOpen(false)}
          ></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-96 p-8 mx-4">
            <div className="flex justify-center mb-4">
              <img
                alt="Logo"
                className="w-24 h-24"
                src="../../src/assets/img/logoremovebg.png"
              />
            </div>
            <h3 className="text-xl font-bold mb-4 text-center">
              CONFIRM PRINT?
            </h3>
            <div className="flex justify-center space-x-4">
              <button
                className="px-4 py-2 !bg-green-500 text-white rounded hover:bg-green-600"
                onClick={handleConfirmPrint}
              >
                YES
              </button>
              <button
                className="px-4 py-2 !bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={handleCancelPrint}
              >
                NO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryStaff;