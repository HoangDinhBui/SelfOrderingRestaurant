import React, { useState, useEffect } from "react";
import axios from "axios";
import MenuBarStaff from "../../../components/layout/MenuBar_Staff";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

// Create a configured axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to attach authentication to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 403) {
      console.log("Authentication required - redirecting to login");
      // Clear any invalid tokens
      localStorage.removeItem("accessToken");
      // Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const TableManagement = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEmptyTableModalOpen, setIsEmptyTableModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [tables, setTables] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTablesAndNotifications = async () => {
      setLoading(true);
      try {
        // Get tables using the DinningTableController endpoint
        const tablesResponse = await api.get("/api/tables");
        const tablesData = tablesResponse.data;
        console.log("Tables data received from API:", tablesData);

        if (tablesData.length > 0) {
          console.log("First table object keys:", Object.keys(tablesData[0]));
        }

        // Fetch active orders to get dishes for each table
        const ordersResponse = await api.get("/api/orders");
        const ordersData = ordersResponse.data;

        // Match orders with tables
        const updatedTables = tablesData.map((table) => {
          // Extract the table ID from the proper field
          const tableId = table.table_id;

          const tableOrders = ordersData.filter(
            (order) => order.tableId === tableId || order.table_id === tableId
          );

          // Extract all dishes from the orders for this table
          const dishes = tableOrders.flatMap(
            (order) =>
              order.orderItems?.map((item) => ({
                name: item.dishName,
                quantity: item.quantity,
                price: item.price,
                status:
                  item.status || (item.isComplete ? "Complete" : "Pending"),
                image: item.dishImage || "../../../assets/img/Mon1.jpg",
                orderId: order.id,
              })) || []
          );

          return {
            id: tableId, // Use the table_id as our internal id
            table_id: tableId, // Keep the original field for reference
            tableNumber: table.tableNumber || tableId,
            capacity: table.capacity || 4,
            status:
              table.status || (dishes.length > 0 ? "OCCUPIED" : "AVAILABLE"),
            dishes: dishes || [],
          };
        });

        console.log("Processed tables:", updatedTables);
        setTables(updatedTables);

        // Fetch notifications
        const notificationsResponse = await api.get(
          "/api/notifications/shift/current"
        );

        // Format notifications to match UI requirements
        const formattedNotifications = notificationsResponse.data.map(
          (notification) => {
            const date = new Date(notification.createdAt);
            return {
              id: notification.id,
              type: notification.type,
              time: date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              date: date.toLocaleDateString(),
              table: notification.tableNumber.toString().padStart(2, "0"),
              message: notification.additionalMessage,
            };
          }
        );

        setNotifications(formattedNotifications);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchTablesAndNotifications();

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchTablesAndNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const updateTableStatus = async (tableId, status) => {
    console.log("Updating table with ID:", tableId);
    console.log("New status:", status);
    try {
      // Use the DinningTableController PUT endpoint
      await api.put(`/api/tables/${tableId}`, {
        status: status,
      });

      // Update local state after successful API call
      const updatedTables = tables.map((table) => {
        if (table.id === tableId) {
          return { ...table, status: status };
        }
        return table;
      });

      setTables(updatedTables);
      return true;
    } catch (err) {
      console.error("Error updating table status:", err);
      setError("Failed to update table status. Please try again.");
      return false;
    }
  };

  const toggleNotificationModal = (e, table) => {
    e.stopPropagation();
    setSelectedTable(table);
    setIsNotificationModalOpen(!isNotificationModalOpen);
  };

  const handleSelectTable = (table) => {
    console.log("Selected table:", table);
    console.log("Table ID type:", typeof table.id);
    console.log("Table ID value:", table.id);
    setSelectedTable(table);
  };

  const handleShowDishModal = (table) => {
    setSelectedTable(table);
    setIsDishModalOpen(true);
  };

  const handleShowPaymentModal = () => {
    setIsDishModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Get all order IDs for this table
      const orderIds = selectedTable.dishes
        .map((dish) => dish.orderId)
        .filter((value, index, self) => self.indexOf(value) === index);

      // Mark all orders as paid
      for (const orderId of orderIds) {
        await api.put(`/api/orders/${orderId}/status`, {
          status: "PAID",
        });
      }

      // Update table status to AVAILABLE
      const statusUpdated = await updateTableStatus(
        selectedTable.id,
        "AVAILABLE"
      );
      if (!statusUpdated) {
        throw new Error("Failed to update table status");
      }

      // Create payment notification
      const notificationData = {
        tableNumber: selectedTable.id,
        customerId: 1, // Default customer ID, adjust as needed
        type: "PAYMENT_COMPLETE",
        additionalMessage: `Payment completed for Table ${
          selectedTable.tableNumber || selectedTable.id
        }`,
      };

      await api.post(`/api/notifications`, notificationData);

      // Update the UI
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);

      // Update the table in local state
      const updatedTables = tables.map((table) => {
        if (table.id === selectedTable.id) {
          return {
            ...table,
            status: "AVAILABLE",
            dishes: [],
          };
        }
        return table;
      });

      setTables(updatedTables);
    } catch (err) {
      console.error("Payment processing error:", err);
      setError("Failed to process payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShowEmptyTableModal = () => {
    setIsEmptyTableModalOpen(true);
  };

  const handleEmptyTable = async () => {
    try {
      // Update table status to AVAILABLE
      const statusUpdated = await updateTableStatus(
        selectedTable.id,
        "AVAILABLE"
      );
      if (!statusUpdated) {
        throw new Error("Failed to update table status");
      }

      // Update the table in local state
      const updatedTables = tables.map((table) => {
        if (table.id === selectedTable.id) {
          return {
            ...table,
            status: "AVAILABLE",
            dishes: [],
          };
        }
        return table;
      });

      setTables(updatedTables);
      setIsEmptyTableModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Error emptying table:", err);
      setError("Failed to empty table. Please try again.");
    }
  };

  const handlePrintReceipt = () => {
    // Logic to generate PDF receipt
    setIsBillModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);

      // Update notifications list in UI
      setNotifications(
        notifications.filter((notif) => notif.id !== notificationId)
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedTable) return;

    try {
      // Create PDF content from table data
      const orderIds = selectedTable.dishes
        .map((dish) => dish.orderId)
        .filter((value, index, self) => self.indexOf(value) === index);

      // Get specific order details if needed
      const orderDetails = await Promise.all(
        orderIds.map((id) => api.get(`/api/orders/${id}`))
      );

      // Format data for PDF
      const pdfData = {
        tableNumber: selectedTable.tableNumber || selectedTable.id,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        dishes: selectedTable.dishes,
        total: selectedTable.dishes.reduce(
          (sum, dish) => sum + dish.price * dish.quantity,
          0
        ),
      };

      // Generate and download PDF
      const response = await api.post(`/api/receipts/generate`, pdfData, {
        responseType: "blob",
      });

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `table-${selectedTable.tableNumber || selectedTable.id}-receipt.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      setIsConfirmModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate receipt PDF");
    }
  };

  const totalAmount =
    selectedTable?.dishes?.reduce(
      (sum, dish) => sum + dish.price * dish.quantity,
      0
    ) || 0;

  const emptyTables = tables.filter((table) => table.status === "AVAILABLE");

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#C2C7CA] flex justify-center items-center">
        <div className="text-xl font-bold">Loading table information...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#C2C7CA] flex justify-center items-center">
      {/* Background blur when any modal is open */}
      <div
        className={`h-full w-full ${
          isDishModalOpen ||
          isPaymentModalOpen ||
          isEmptyTableModalOpen ||
          isBillModalOpen ||
          isConfirmModalOpen ||
          isSuccessModalOpen ||
          isNotificationModalOpen
            ? "blur-sm"
            : ""
        }`}
        onClick={() => setIsNotificationModalOpen(false)}
      >
        <MenuBarStaff />
        {/* Container chính nằm giữa */}
        <div
          style={{ marginTop: "30px" }}
          className="flex-1 flex justify-center Items-center"
        >
          <div className="w-[90%] h-[95%] bg-[#F0F8FD] rounded-lg shadow-lg overflow-hidden">
            {/* Nội dung chính */}
            <div className="flex-1 p-6 bg-gray-100 flex">
              {/* Table Grid */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                {/* Nội dung bảng */}
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
                    onClick={() => handleSelectTable(table)}
                  >
                    {/* Table Header */}
                    <div
                      style={{ backgroundColor: "#1C2E4A" }}
                      className="text-white p-3 flex justify-between items-center"
                    >
                      <h2 className="font-bold">Table {table.id}</h2>
                      <div className="flex items-center gap-2">
                        <span>{table.capacity}</span>
                        <img
                          width="15"
                          height="15"
                          src="https://img.icons8.com/ios-glyphs/90/FFFFFF/guest-male.png"
                          alt="guest-male"
                        />
                      </div>
                    </div>
                    {/* Table Details */}
                    <div className="grid grid-cols-2 bg-gray-200">
                      <div
                        style={{
                          backgroundColor: "#BDC4D4",
                          borderRight: "1px solid #fff",
                        }}
                        className="p-4 flex flex-col items-center justify-center"
                      >
                        <span className="text-lg">Time</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div
                        style={{ backgroundColor: "#BDC4D4" }}
                        className="p-4 flex items-center justify-center cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowDishModal(table);
                        }}
                      >
                        <span className="text-lg">
                          {table.dishes.length > 0
                            ? `Dish ${
                                table.dishes.filter(
                                  (d) => d.status === "Complete"
                                ).length
                              }/${table.dishes.length}`
                            : "No dishes"}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-2 flex justify-between items-center">
                      <div className="flex items-center">
                        <div
                          className={`w-6 h-6 ${
                            table.status === "occupied"
                              ? "bg-gray-700"
                              : "bg-green-500"
                          } rounded-full mr-2`}
                        ></div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-gray-500 mx-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div
                          className="relative cursor-pointer"
                          onClick={(e) => toggleNotificationModal(e, table)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                          {table.status === "occupied" &&
                            notifications.filter(
                              (n) =>
                                n.table === table.id.toString().padStart(2, "0")
                            ).length > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                                {
                                  notifications.filter(
                                    (n) =>
                                      n.table ===
                                      table.id.toString().padStart(2, "0")
                                  ).length
                                }
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="px-4 py-2 flex justify-between items-center">
                        <div className="flex items-center">
                          {/* SVG icon */}
                          {table.status === "occupied" ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-red-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-green-500"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Side Information Cards */}
              <div className="ml-4 w-64 flex flex-col gap-4">
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p>: Available Table</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p>: Occupied Table</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                    <p>: Paid</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-700 rounded-full"></div>
                    <p>: Unpaid</p>
                  </div>
                </div>

                <div className="mt-2">
                  <button
                    style={{ backgroundColor: "#BDC4D4" }}
                    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                    onClick={handleShowEmptyTableModal}
                  >
                    <b style={{ color: "#FFFFFF" }} className="text-lg">
                      Empty Table List
                    </b>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Modal */}
      {isNotificationModalOpen && selectedTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0  bg-opacity-50"
            onClick={() => setIsNotificationModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div
            className="bg-[#F0F9FF] rounded-xl shadow-lg p-6 
            w-[500px] max-w-full max-h-[80vh] 
            overflow-y-auto z-50 relative"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Notifications
              </h2>
              <div className="text-sm text-gray-600">
                Table {selectedTable.tableNumber || selectedTable.id} (ID:{" "}
                {selectedTable.id})
              </div>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setIsNotificationModalOpen(false)}
              >
                &times;
              </button>
            </div>

            {/* Table */}
            <table className="w-full text-sm border-separate border-spacing-y-1">
              <thead className="bg-cyan-200 text-gray-800 rounded-md">
                <tr>
                  <th className="py-1 text-left pl-2">ON</th>
                  <th className="py-1 text-left">Request</th>
                  <th className="py-1 text-left pr-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {notifications
                  .filter(
                    (n) =>
                      n.table === selectedTable.id.toString().padStart(2, "0")
                  )
                  .map((notification) => (
                    <tr
                      key={notification.id}
                      className="bg-white shadow-sm rounded-md"
                    >
                      <td className="py-1 px-2">{notification.table}</td>
                      <td className="py-1">{notification.type}</td>
                      <td className="py-1 pr-2">
                        <div>{notification.time}</div>
                        <div>{notification.date}</div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dish Modal */}
      {isDishModalOpen && selectedTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-opacity-50"
            onClick={() => setIsDishModalOpen(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-lg p-6 w-1/2 relative z-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Table {selectedTable.id} - Dishes
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsDishModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {selectedTable.dishes.map((dish, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center border-b pb-2"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <span>{dish.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 bg-gray-200 rounded">-</button>
                    <span>{dish.quantity}</span>
                    <button className="px-2 py-1 bg-gray-200 rounded">+</button>
                  </div>
                  <span
                    className={`px-3 py-1 rounded ${
                      dish.status === "Complete"
                        ? "bg-green-500 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {dish.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                onClick={handleShowPaymentModal}
              >
                Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-opacity-50"
            onClick={() => setIsPaymentModalOpen(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-xl p-6 w-2/3 relative z-50">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                450 Le Van Viel Street, Tang Nhon Phu A Word, District 9
              </p>
              <p className="text-sm text-gray-600">Phone: 0987654321</p>
              <h3 className="font-bold mt-2 text-xl text-blue-800">
                Payment Slip 001
              </h3>
            </div>

            <div className="flex justify-between border-b pb-2 mb-4">
              <span className="font-bold text-gray-700">
                Table {selectedTable.id}
              </span>
              <span className="font-bold text-gray-700">Payment Slip 001</span>
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
                        {dish.price ? dish.price.toLocaleString() : "-"}
                      </td>
                      <td className="py-3 font-medium">
                        {dish.price
                          ? (dish.price * dish.quantity).toLocaleString()
                          : "-"}
                      </td>
                      <td className="py-3 text-gray-500">-</td>
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
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="!bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
                onClick={handlePaymentSuccess}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Table List Modal */}
      {isEmptyTableModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-opacity-50"
            onClick={() => setIsEmptyTableModalOpen(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative z-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Empty Table List</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsEmptyTableModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div>
              <table className="w-full">
                <thead>
                  <tr className="bg-teal-100">
                    <th className="p-2 text-left">Table</th>
                    <th className="p-2 text-left">Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {emptyTables.map((table) => (
                    <tr key={table.id} className="border-b">
                      <td className="p-2">{table.id}</td>
                      <td className="p-2">
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          {table.capacity}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bill Modal */}
      {isBillModalOpen && selectedTable && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-opacity-50"
            onClick={() => setIsBillModalOpen(false)}
          ></div>
          <div className="bg-white rounded-lg shadow-xl p-6 w-2/3 relative z-50">
            <div className="text-center mb-4">
              <h3 className="font-bold text-xl text-blue-800">Bill Details</h3>
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
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTable.dishes.map((dish, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 text-gray-800">{dish.name}</td>
                      <td className="py-3">{dish.quantity}</td>
                      <td className="py-3">
                        {dish.price.toLocaleString()} VND
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4 border-t pt-4">
              <span className="font-bold text-lg text-blue-800">
                Total: {totalAmount.toLocaleString()} VND
              </span>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                onClick={() => setIsBillModalOpen(false)}
              >
                Close
              </button>
              <button
                className="!bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                onClick={handlePrintReceipt}
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-opacity-50"
            onClick={() => setIsConfirmModalOpen(false)}
          ></div>
          <div className="bg-white rounded-lg p-6 w-80 relative z-50 text-center">
            <div className="flex justify-center mb-4">
              <img
                alt="Logo"
                className="w-24 h-24"
                src="../../src/assets/img/logoremovebg.png"
              />
            </div>
            <p className="text-lg mb-6">ARE YOU SURE?</p>
            <div className="flex justify-center space-x-4">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                NO
              </button>
              <button
                className="!bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setIsSuccessModalOpen(true);
                }}
              >
                YES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-opacity-50"
            onClick={() => setIsSuccessModalOpen(false)}
          ></div>
          <div className="bg-white rounded-lg p-6 w-80 relative z-50 text-center">
            <div className="flex justify-center mb-4">
              <img
                alt="Logo"
                className="w-24 h-24"
                src="../../src/assets/img/logoremovebg.png"
              />
            </div>
            <p className="text-lg mb-6 text-green-600 font-medium">
              Payment Successful
            </p>
            <button
              className="!bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
              onClick={() => setIsSuccessModalOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
