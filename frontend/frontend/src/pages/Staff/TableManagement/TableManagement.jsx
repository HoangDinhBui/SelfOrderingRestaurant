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
  const [unreadCount, setUnreadCount] = useState(0);
  const [tableNotifications, setTableNotifications] = useState({});

  // Format date for display - Added from first code snippet
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if date is today
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }

    // Check if date is yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }

    // Otherwise return formatted date
    return date.toLocaleDateString();
  };

  // Format time for display - Added from first code snippet
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Initial data fetch and polling setup
  useEffect(() => {
    fetchTablesAndNotifications();

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchTablesAndNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      // Check if our flag was updated
      const lastUpdate = localStorage.getItem("notificationsUpdated");
      if (lastUpdate) {
        // Clear the flag
        localStorage.removeItem("notificationsUpdated");

        // Refresh notifications
        fetchTablesAndNotifications();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Check for changes when component mounts
    handleStorageChange();

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Initial data fetch and polling setup
  useEffect(() => {
    fetchTablesAndNotifications();

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchTablesAndNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      // Check if our flag was updated
      const lastUpdate = localStorage.getItem("notificationsUpdated");
      if (lastUpdate) {
        // Clear the flag
        localStorage.removeItem("notificationsUpdated");

        // Refresh notifications
        fetchTablesAndNotifications();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Check for changes when component mounts
    handleStorageChange();

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const showTableNotifications = (e, tableId) => {
    e.stopPropagation();

    // Filter notifications for specific table
    const tableSpecificNotifications = notifications.filter(
      (notification) => notification.tableId === tableId
    );

    // Show notifications and mark as read
    setSelectedTable({
      ...tables.find((t) => t.id === tableId),
      notifications: tableSpecificNotifications,
    });
    setIsNotificationModalOpen(true);

    // Mark all notifications for this table as read in backend
    tableSpecificNotifications.forEach((notification) => {
      if (!notification.isRead) {
        markNotificationAsRead(notification.id);
      }
    });

    // Update local notification counter
    const updatedTableNotifications = { ...tableNotifications };
    updatedTableNotifications[tableId] = 0;
    setTableNotifications(updatedTableNotifications);
  };

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
    if (table) {
      setSelectedTable(table);
      setIsNotificationModalOpen(true);
    } else {
      setIsNotificationModalOpen(!isNotificationModalOpen);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      // Call the API to mark notification as read
      await api.put(`/api/notifications/${notificationId}/read`);

      // Update the notifications state
      const updatedNotifications = notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );
      setNotifications(updatedNotifications);

      // If a table is selected, update its notifications
      if (selectedTable) {
        const updatedTableNotifications = selectedTable.notifications.map(
          (notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
        );

        setSelectedTable({
          ...selectedTable,
          notifications: updatedTableNotifications,
        });

        // Update the badges count - recalculate unread for this table
        const tableId = selectedTable.id;
        const unreadForTable = updatedTableNotifications.filter(
          (notification) => !notification.isRead
        ).length;

        setTableNotifications((prev) => ({
          ...prev,
          [tableId]: unreadForTable,
        }));

        // After marking all notifications as read, recalculate the total unread count
        const totalUnread = Object.values({
          ...tableNotifications,
          [tableId]: unreadForTable,
        }).reduce((sum, count) => sum + count, 0);

        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
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

      // Refresh data to ensure consistency
      setTimeout(() => {
        fetchTablesAndNotifications();
      }, 1000);
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

      // Refresh data to ensure consistency
      setTimeout(() => {
        fetchTablesAndNotifications();
      }, 1000);
    } catch (err) {
      console.error("Error emptying table:", err);
      setError("Failed to empty table. Please try again.");
    }
  };

  const handleShowBillModal = () => {
    setIsBillModalOpen(true);
  };

  const handlePrintReceipt = () => {
    // Logic to generate PDF receipt
    setIsBillModalOpen(false);
    setIsConfirmModalOpen(true);
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

  // Move this function outside of any useEffect to make it available throughout the component
  const fetchTablesAndNotifications = async () => {
    setLoading(true);
    try {
      // First fetch notifications to determine table status
      const notificationsResponse = await api.get(
        "/api/notifications/shift/current"
      );

      // Format notifications and track unread ones by table
      const notificationsByTable = {};

      const formattedNotifications = notificationsResponse.data
        .filter(
          (notification) => notification !== null && notification !== undefined
        )
        .map((notification) => {
          // Handle date formatting with improved error handling
          let date;
          try {
            if (notification.createdAt || notification.createAt) {
              const rawDate = notification.createdAt || notification.createAt;
              date = new Date(rawDate);
              console.log("Parsed notification date:", date, "from:", rawDate);

              // Additional validation - if still invalid after parsing, log the issue
              if (isNaN(date.getTime())) {
                console.error("Invalid date format in notification:", rawDate);
                date = new Date(); // Fallback to current date
              }
            } else {
              console.warn(
                "Missing createdAt timestamp for notification:",
                notification.id || "unknown"
              );
              date = new Date(); // Fallback to current date
            }
          } catch (error) {
            console.error(
              "Error parsing date:",
              error,
              "Raw value:",
              notification.createdAt
            );
            date = new Date(); // Fallback to current date
          }

          // Rest of your notification mapping logic
          let tableNumber = "";
          let tableId = null;

          if (
            notification.tableNumber !== undefined &&
            notification.tableNumber !== null
          ) {
            tableNumber = notification.tableNumber.toString().padStart(2, "0");
            tableId = notification.tableNumber;
          } else if (
            notification.tableId !== undefined &&
            notification.tableId !== null
          ) {
            tableNumber = notification.tableId.toString().padStart(2, "0");
            tableId = notification.tableId;
          } else {
            console.warn(
              "Missing table information for notification:",
              notification.id || "unknown"
            );
            tableNumber = "N/A";
          }

          // Track unread notifications by table
          if (!notification.isRead && tableId !== null) {
            if (!notificationsByTable[tableId]) {
              notificationsByTable[tableId] = 0;
            }
            notificationsByTable[tableId]++;
          }

          const formattedDate = formatDate(date);
          const formattedTime = formatTime(date);

          return {
            id:
              notification.id ||
              notification.notificationId ||
              "unknown-" + Math.random().toString(36).substring(2, 9),
            type: notification.type || "UNKNOWN",
            time: formattedTime,
            date: formattedDate,
            table: tableNumber,
            tableId: tableId,
            message:
              notification.additionalMessage ||
              notification.content ||
              notification.message ||
              "",
            isRead: notification.isRead || false,
            createdAt: date, // Store the full date for potential future use
          };
        });

      // Now get tables using the DinningTableController endpoint
      const tablesResponse = await api.get("/api/tables");
      const tablesData = tablesResponse.data;
      console.log("Tables data received from API:", tablesData);

      // Fetch active orders to get dishes for each table
      const ordersResponse = await api.get("/api/orders");
      const ordersData = ordersResponse.data;

      // Match orders with tables and update status based on both dishes and notifications
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
              status: item.status || (item.isComplete ? "Complete" : "Pending"),
              image: item.dishImage || "../../../assets/img/Mon1.jpg",
              orderId: order.id,
            })) || []
        );

        // Determine table status based on server status, dishes, and notifications
        let status = table.status;

        // If server doesn't provide status, determine it based on our logic
        // Check if there are dishes - if yes, table is occupied
        if (dishes.length > 0) {
          status = "OCCUPIED";
        }
        // Check if there are unread notifications - if yes, table is occupied
        else if (
          notificationsByTable[tableId] &&
          notificationsByTable[tableId] > 0
        ) {
          status = "OCCUPIED";
        }
        // Otherwise table is available
        else {
          status = "AVAILABLE";
        }

        console.log(
          `Table ${tableId} - Dishes: ${dishes.length}, Notifications: ${
            notificationsByTable[tableId] || 0
          }, Status: ${status}`
        );

        return {
          id: tableId,
          table_id: tableId,
          tableNumber: table.tableNumber || tableId,
          capacity: table.capacity || 4,
          status: status,
          dishes: dishes || [],
        };
      });

      console.log("Processed tables:", updatedTables);
      setTables(updatedTables);
      setNotifications(formattedNotifications);
      setTableNotifications(notificationsByTable);

      // Calculate total unread notifications
      const totalUnread = Object.values(notificationsByTable).reduce(
        (sum, count) => sum + count,
        0
      );
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Group notifications by date as in the first code snippet
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const date = notification.date; // We already formatted the date
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(notification);
    return acc;
  }, {});

  // In your first useEffect
  useEffect(() => {
    fetchTablesAndNotifications();

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchTablesAndNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Your second useEffect for localStorage remains the same
  useEffect(() => {
    const handleStorageChange = () => {
      // Check if our flag was updated
      const lastUpdate = localStorage.getItem("notificationsUpdated");
      if (lastUpdate) {
        // Clear the flag
        localStorage.removeItem("notificationsUpdated");

        // Refresh notifications
        fetchTablesAndNotifications();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Check for changes when component mounts
    handleStorageChange();

    // Remove event listener on cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Component NotificationBell với badge
  const NotificationBell = ({ tableId }) => {
    return (
      <div
        className="relative cursor-pointer"
        onClick={(e) => showTableNotifications(e, tableId)}
      >
        {/* Bell icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-700"
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

        {/* Notification badge */}
        {tableNotifications[tableId] > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs font-bold">
            {tableNotifications[tableId] > 9
              ? "9+"
              : tableNotifications[tableId]}
          </div>
        )}
      </div>
    );
  };

  const TableNotificationModal = () => {
    if (!isNotificationModalOpen || !selectedTable?.notifications) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Notifications for Table{" "}
              {selectedTable.tableNumber || selectedTable.id}
            </h2>
            <button
              onClick={() => setIsNotificationModalOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {selectedTable.notifications.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No notifications for this table
            </p>
          ) : (
            <div className="space-y-3">
              {selectedTable.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border rounded-lg ${
                    notification.isRead
                      ? "bg-gray-50 border-gray-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{notification.type}</span>
                    <span className="text-sm text-gray-500">
                      {notification.time} | {notification.date}
                    </span>
                  </div>
                  <p className="mt-1">{notification.message}</p>
                  {!notification.isRead && (
                    <button
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TableCard = ({
    table,
    onSelect,
    tableNotifications,
    toggleNotificationModal,
    handleShowDishModal,
  }) => {
    return (
      <div
        className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
        onClick={() => onSelect(table)}
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
                    table.dishes.filter((d) => d.status === "Complete").length
                  }/${table.dishes.length}`
                : "No dishes"}
            </span>
          </div>
        </div>

        {/* Table Footer with Status Indicators */}
        <div className="px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            {/* Payment Status Indicator */}
            <div
              className={`w-6 h-6 ${
                table.status === "OCCUPIED" ? "bg-gray-700" : "bg-green-500"
              } rounded-full mr-2`}
            ></div>

            {/* Payment Icon */}
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

            {/* Notification Bell */}
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

              {/* Notification Badge */}
              {tableNotifications[table.id] > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs font-bold">
                  {tableNotifications[table.id] > 9
                    ? "9+"
                    : tableNotifications[table.id]}
                </div>
              )}
            </div>
          </div>

          {/* Table Status Indicator */}
          <div className="flex items-center">
            {table.status === "OCCUPIED" ? (
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
    );
  };

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
        <TableNotificationModal />
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
                {/* Replace this section with TableCard component */}
                {tables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    onSelect={handleSelectTable}
                    tableNotifications={tableNotifications}
                    toggleNotificationModal={toggleNotificationModal}
                    handleShowDishModal={handleShowDishModal}
                  />
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
