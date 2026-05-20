import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import {
  FaCheck,
  FaTrash,
  FaMoneyBillWave,
  FaBell,
  FaUtensils,
} from "react-icons/fa";
import MenuBarStaff from "../../../components/layout/MenuBar_Staff.jsx";
import MenuBar from "../../../components/layout/menuBar.jsx";

// GraphQL query to fetch all orders
const GET_ORDERS = gql`
  query Orders {
    orders {
      orderId
      customerName
      tableNumber
      totalAmount
      paymentStatus
      status
      items {
        dishId
        dishName
        quantity
        price
        notes
      }
    }
  }
`;

const OrderHistory = () => {
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const navigate = useNavigate();

  // Fetch orders using Apollo Client
  const { loading, error, data } = useQuery(GET_ORDERS);

  // Transform orders to match the notification structure, only include PENDING orders
  const notifications = data?.orders
    ? data.orders
        .filter((order) => order.paymentStatus === "PAID")
        .map((order) => ({
          id: order.orderId,
          customer: order.customerName,
          table: order.tableNumber, // Chỉ hiển thị số bàn
          paymentSlip: order.orderId,
          total: order.totalAmount,
          time: new Date().toLocaleTimeString(),
        }))
    : [];

  // Transform orders to dishes for modal display
  const orderItems = data?.orders
    ? data.orders.reduce((acc, order) => {
        acc[order.orderId] = order.items.map((item) => ({
          name: item.dishName,
          quantity: item.quantity,
          price: item.price,
          note: item.notes || "-",
        }));
        return acc;
      }, {})
    : {};

  const handleViewBill = (notification) => {
    const tableData = {
      id: notification.table.toString(), // Chuyển số bàn thành chuỗi
      dishes: orderItems[notification.id] || [],
    };
    setSelectedTable(tableData);
    setTotalAmount(notification.total);
    setIsBillModalOpen(true);
  };

  const handlePrintBill = async (orderId) => {
    try {
      const response = await fetch(`/api/receipts/generate/${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-order-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setIsPrintModalOpen(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate receipt. Please try again.");
    }
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
    if (selectedTable) {
      const orderId = notifications.find(
        (noti) => noti.table.toString() === selectedTable.id
      )?.id;
      if (orderId) {
        handlePrintBill(orderId);
      }
    }
    setIsPrintModalOpen(false);
  };

  const handleCancelPrint = () => {
    setIsPrintModalOpen(false);
  };

  const tabs = ["Order Management", "Notification Management", "Dish Management"];

  const handleTabClick = (tab) => {
    if (tab === "Order Management") {
      navigate("/order-management");
    } else if (tab === "Dish Management") {
      navigate("/dish-management");
    }
  };

  const isModalOpen = isBillModalOpen || isPrintModalOpen;

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>Error loading orders: {error.message}</p>;

  return (
    <div className="h-screen w-screen !bg-blue-50 flex flex-col">
      <div className={isModalOpen ? "blur-sm" : ""}>
        <MenuBar
          title="Order History"
          icon="https://img.icons8.com/?size=100&id=24874&format=png&color=FFFFFF"
        />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 p-6 bg-gray-100 overflow-y-auto ${
          isModalOpen ? "blur-sm" : ""
        }`}
      >
        {/* Notification List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Pending Orders</h2>
          {notifications.length === 0 ? (
            <p>No pending orders found.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="relative flex justify-between items-center bg-white rounded-lg shadow-md p-4 mb-4"
              >
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-15 h-15 bg-gray-200 rounded-full mr-4">
                    Table:{notification.table}
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
                    onClick={() => {
                      setSelectedTable({
                        id: notification.table.toString(),
                        dishes: orderItems[notification.id] || [],
                      });
                      setIsPrintModalOpen(true);
                    }}
                  >
                    <FaTrash className="mr-1" /> Print
                  </button>
                </div>
              </div>
            ))
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
                Payment Slip {selectedTable.id.padStart(3, "0")}
              </h3>
            </div>

            <div className="flex justify-between border-b pb-2 mb-4">
              <span className="font-bold text-gray-700">Table {selectedTable.id}</span>
              <span className="font-bold text-gray-700">
                Payment Slip {selectedTable.id.padStart(3, "0")}
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

export default OrderHistory;