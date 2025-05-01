import React, { useState, useEffect } from "react";
import {
  FaCheck,
  FaTrash,
  FaMoneyBillWave,
  FaBell,
  FaUtensils,
  FaShoppingCart,
  FaCreditCard,
} from "react-icons/fa";
import MenuBarStaff from "../../../components/layout/MenuBar_Staff";
import axios from "axios";
import Order from "../../Customer/Order/Order";

const OrderHistoryStaff= () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  // Base API URL to ensure consistency
  const API_BASE_URL = "http://localhost:8080";

  // Add consistent sorting function after state declarations
  function sortByNewestFirst(a, b) {
    // Get timestamps, with fallbacks in case data is missing
    const timeA =
      a.createdAtTimestamp ||
      (a.createdAt instanceof Date
        ? a.createdAt.getTime()
        : typeof a.createdAt === "string"
        ? new Date(a.createdAt).getTime()
        : 0);

    const timeB =
      b.createdAtTimestamp ||
      (b.createdAt instanceof Date
        ? b.createdAt.getTime()
        : typeof b.createdAt === "string"
        ? new Date(b.createdAt).getTime()
        : 0);

    return timeB - timeA; // Newest first
  }

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/notifications/shift/current`
      );

      if (response.data && Array.isArray(response.data)) {
        // Map the backend fields to frontend fields for consistency
        const mappedNotifications = response.data.map((notification) => {
          // Create a Date object from the timestamp
          const createdAtDate = new Date(notification.createAt);

          return {
            id: notification.notificationId,
            tableId: notification.tableNumber,
            message: notification.content,
            type: notification.type,
            checked: notification.isRead,
            createdAt: createdAtDate, // Date object
            createdAtTimestamp: createdAtDate.getTime(), // Add timestamp for sorting
            orderId: notification.orderId,
            paymentMethod: notification.paymentMethod,
            // Include the raw timestamp for reference
            rawTimestamp: notification.createAt,
          };
        });

        // Sort notifications using the consistent sort function
        const sortedNotifications = mappedNotifications.sort(sortByNewestFirst);
        setNotifications(sortedNotifications);
      } else {
        console.error("Unexpected API response format:", response.data);
        setError("Failed to load notifications. Unexpected data format.");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load notifications when component mounts
  useEffect(() => {
    fetchNotifications();

    // Set up polling to check for new notifications every 30 seconds
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Format date for display
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

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const date = formatDate(notification.createdAt);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({
      ...notification,
      formattedTime: formatTime(notification.createdAt),
    });
    return acc;
  }, {});

  // Sort notifications within each date group using the consistent sort function
  Object.keys(groupedNotifications).forEach((date) => {
    groupedNotifications[date].sort(sortByNewestFirst);
  });

  // Enhanced function to get friendly payment method display text
  const getPaymentMethodDisplayText = (method) => {
    switch (method) {
      case "CASH":
        return "Cash";
      case "VNPAY":
        return "VNPay";
      case "CREDIT":
        return "Credit Card";
      case "MOMO":
        return "Momo";
      default:
        return method || "";
    }
  };

  // Function to enhance notification message with payment method info if needed
  const enhanceNotificationMessage = (notification) => {
    let message = notification.message || "";

    // For payment notifications, enhance with payment method info if available
    if (notification.type === "PAYMENT_REQUEST" && notification.paymentMethod) {
      if (!message.toLowerCase().includes("using")) {
        const paymentMethodText = getPaymentMethodDisplayText(
          notification.paymentMethod
        );
        message = `${message} using ${paymentMethodText}`;
      }
    }

    return message;
  };

  // Get payment method icon based on the payment method
  const getPaymentMethodIcon = (paymentMethod) => {
    switch (paymentMethod) {
      case "CASH":
        return <FaMoneyBillWave />;
      case "VNPAY":
        return <FaCreditCard />;
      case "CREDIT":
        return <FaCreditCard />;
      case "MOMO":
        return <FaCreditCard />;
      default:
        return null;
    }
  };

  // Updated function to mark notification as read
  const handleCheckNotification = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/api/notifications/${id}/read`);

      // Update local state
      const updatedNotifications = notifications.map((noti) =>
        noti.id === id ? { ...noti, isRead: true, checked: true } : noti
      );

      // Apply consistent sorting after updating
      const sortedUpdatedNotifications =
        updatedNotifications.sort(sortByNewestFirst);
      setNotifications(sortedUpdatedNotifications);

      // You need a way to communicate this change to TableManagement
      // One approach is to use localStorage to signal that notifications changed
      localStorage.setItem("notificationsUpdated", Date.now().toString());

      // Or if you're using a state management library like Redux, you would dispatch an action here
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError("Failed to mark notification as read.");
    }
  };

  const handleDeleteClick = (id) => {
    setNotificationToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (notificationToDelete) {
      try {
        // Call the API to delete the notification
        const response = await fetch(
          `/api/notifications/${notificationToDelete}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          // If API call successful, update the UI
          const filteredNotifications = notifications.filter(
            (noti) => noti.id !== notificationToDelete
          );

          // Apply consistent sorting after deleting
          const sortedFilteredNotifications =
            filteredNotifications.sort(sortByNewestFirst);
          setNotifications(sortedFilteredNotifications);

          // Optional: Show success toast/message
          // toast.success("Notification deleted successfully");
        } else {
          // Handle error response
          const errorData = await response.json();
          console.error("Failed to delete notification:", errorData.error);
          // Optional: Show error toast/message
          // toast.error("Failed to delete notification");
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
        // Optional: Show error toast/message
        // toast.error("Error deleting notification");
      }

      setShowDeleteModal(false);
      setNotificationToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setNotificationToDelete(null);
  };

  // Updated function to handle backend notification types
  const getNotificationIcon = (type) => {
    switch (type) {
      case "PAYMENT_REQUEST":
      case "PAYMENT":
        return <FaMoneyBillWave />;
      case "CALL_STAFF":
      case "CALL":
        return <FaBell />;
      case "NEW_ORDER":
      case "ORDER":
        return <FaUtensils />;
      default:
        return <FaShoppingCart />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-lg mb-4">
            <p className="text-red-500">{error}</p>
          </div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={fetchNotifications}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen !bg-blue-50 flex flex-col">
      <MenuBarStaff />

      <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">
        {/* Notification List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {Object.keys(groupedNotifications).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notifications to display
            </div>
          ) : (
            Object.entries(groupedNotifications).map(
              ([date, dateNotifications]) => (
                <div key={date} className="mb-8">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">
                    {date}
                  </h2>
                  {dateNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="mb-6 border-b pb-4 last:border-b-0"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          {getNotificationIcon(notification.type)}
                          <div>
                            <h3 className="font-bold">
                              Table {notification.tableId}
                            </h3>
                            <p className="text-gray-600 flex items-center">
                              - {notification.type}
                              {notification.type === "PAYMENT_REQUEST" &&
                                notification.paymentMethod && (
                                  <span className="flex items-center ml-2">
                                    via{" "}
                                    {getPaymentMethodDisplayText(
                                      notification.paymentMethod
                                    )}
                                    {getPaymentMethodIcon(
                                      notification.paymentMethod
                                    )}
                                  </span>
                                )}
                            </p>
                          </div>
                        </div>
                        <span className="text-gray-500">
                          {notification.formattedTime}
                        </span>
                      </div>
                      <p className="mb-4 pl-8">
                        {enhanceNotificationMessage(notification)}
                      </p>
                      <div className="flex justify-end space-x-4">
                        <button
                          className={`flex items-center px-3 py-1 text-white rounded ${
                            notification.checked
                              ? "!bg-gray-400 cursor-not-allowed"
                              : "!bg-green-500 hover:bg-green-600"
                          }`}
                          onClick={() =>
                            handleCheckNotification(notification.id)
                          }
                          disabled={notification.checked}
                        >
                          <FaCheck className="mr-1" />{" "}
                          {notification.checked ? "Checked" : "Check"}
                        </button>
                        <button
                          className="flex items-center px-3 py-1 !bg-red-500 text-white rounded hover:bg-red-600"
                          onClick={() => handleDeleteClick(notification.id)}
                        >
                          <FaTrash className="mr-1" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-xl shadow-2xl w-96 p-8 mx-4">
            <div className="flex justify-center mb-4">
              <img
                alt="Logo"
                className="w-24 h-24"
                src="../../src/assets/img/logoremovebg.png"
              ></img>
            </div>
            <h3 className="text-xl font-bold mb-4 text-center">
              ARE YOU SURE?
            </h3>
            <div className="flex justify-center space-x-4">
              <button
                className="px-4 py-2 !bg-red-500 text-white rounded hover:bg-red-600"
                onClick={handleConfirmDelete}
              >
                YES
              </button>
              <button
                className="px-4 py-2 !bg-gray-500 text-white rounded hover:bg-gray-600"
                onClick={handleCancelDelete}
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
