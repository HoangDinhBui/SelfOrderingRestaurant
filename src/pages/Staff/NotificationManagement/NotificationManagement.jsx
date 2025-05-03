import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCheck,
  FaTrash,
  FaMoneyBillWave,
  FaBell,
  FaUtensils,
} from "react-icons/fa";
import { toast } from "react-toastify";
import MenuBarStaff from "../../../components/layout/MenuBar_Staff.jsx";
import MenuBar from "../../../components/layout/MenuBar.jsx";
import {
  getCurrentShiftNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../../../services/notificationService";
import { confirmPayment, getPaymentStatus } from "../../../services/paymentAPI";
import { format, parseISO, isToday } from "date-fns";

const NotificationManagementStaff = () => {
  const [activeTab, setActiveTab] = useState("Notification Management");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const tabs = [
    "Order Management",
    "Notification Management",
    "Dish Management",
  ];
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    let socket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 2000;

    const setupWebSocket = () => {
      try {
        const userId = localStorage.getItem("userId") || "123";
        const userType = "STAFF";
        const wsUrl = `ws://localhost:8080/ws/notifications?userId=${userId}&userType=${userType}`;
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log("WebSocket connection established");
          reconnectAttempts = 0;
          const pingInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "PING" }));
            }
          }, 10000);
          socket.pingInterval = pingInterval;
        };

        socket.onmessage = (event) => {
          console.log("Raw WebSocket message received:", event.data);
          try {
            if (event.data === "PONG") return;
            const data = JSON.parse(event.data);
            console.log("Parsed WebSocket message:", data);

            let newNotification;
            if (data.type === "NOTIFICATION") {
              newNotification = data.notification || data;
            } else {
              newNotification = data;
            }

            if (!newNotification.notificationId) {
              console.warn(
                "Received notification without ID:",
                newNotification
              );
              return;
            }

            setNotifications((prevNotifications) => {
              const exists = prevNotifications.some(
                (n) => n.notificationId === newNotification.notificationId
              );
              if (exists) return prevNotifications;

              const date = new Date(newNotification.createAt || new Date());
              const processedNotification = {
                ...newNotification,
                tableNumber: newNotification.tableNumber || "Unknown",
                content: newNotification.content || "New notification",
                dateObj: date,
                dateString: isToday(date)
                  ? "Today"
                  : format(date, "dd/MM/yyyy"),
                timeString: format(date, "HH:mm:ss"),
                dateTimestamp: date.getTime(),
              };

              toast.info(
                `New notification from Table ${processedNotification.tableNumber}: ${processedNotification.content}`,
                { autoClose: 5000 }
              );

              return [processedNotification, ...prevNotifications].sort(
                (a, b) => b.dateTimestamp - a.dateTimestamp
              );
            });
          } catch (err) {
            console.error("Error processing WebSocket message:", err);
            toast.error("Error processing real-time notification");
          }
        };

        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        socket.onclose = (event) => {
          console.log(
            `WebSocket connection closed: ${event.code} ${event.reason}`
          );
          if (socket.pingInterval) {
            clearInterval(socket.pingInterval);
          }

          if (reconnectAttempts < maxReconnectAttempts) {
            console.log(
              `Attempting to reconnect (${
                reconnectAttempts + 1
              }/${maxReconnectAttempts})...`
            );
            reconnectAttempts++;
            setTimeout(setupWebSocket, reconnectDelay);
          } else {
            console.log(
              "Max reconnect attempts reached. Falling back to polling only."
            );
            toast.warn("Real-time notifications unavailable. Using polling.", {
              autoClose: 5000,
            });
          }
        };
      } catch (err) {
        console.error("Failed to create WebSocket connection:", err);
        toast.error("Failed to connect to real-time notifications");
      }
    };

    setupWebSocket();

    const pollingInterval = setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.log("WebSocket not connected, using polling fallback");
        fetchNotifications();
      }
    }, 10000);

    return () => {
      if (socket) {
        reconnectAttempts = maxReconnectAttempts;
        if (socket.readyState === WebSocket.OPEN) {
          socket.close(1000, "Component unmounting");
        }
        if (socket.pingInterval) {
          clearInterval(socket.pingInterval);
        }
      }
      clearInterval(pollingInterval);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(notifications.length === 0);
      const data = await getCurrentShiftNotifications();
      console.log("Fetched notifications:", data); // Debug log
      if (Array.isArray(data)) {
        setNotifications((prevNotifications) => {
          const newNotifications = data.map((notification) => {
            const date = new Date(notification.createAt || new Date());
            return {
              ...notification,
              dateObj: date,
              dateString: isToday(date) ? "Today" : format(date, "dd/MM/yyyy"),
              timeString: format(date, "HH:mm:ss"),
              dateTimestamp: date.getTime(),
            };
          });

          const mergedNotifications = [
            ...prevNotifications,
            ...newNotifications.filter(
              (n) =>
                !prevNotifications.some(
                  (p) => p.notificationId === n.notificationId
                )
            ),
          ];
          return mergedNotifications.sort(
            (a, b) => b.dateTimestamp - a.dateTimestamp
          );
        });
        setError(null);
      } else {
        console.error("Invalid notification data format received:", data);
        setError("Invalid notification data received from server");
        toast.error("Invalid notification data format");
      }
    } catch (err) {
      console.error("Error fetching notifications:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
      });
      setError(
        `Failed to fetch notifications: ${
          err.response?.data?.error || err.message
        }`
      );
      toast.error(
        `Failed to fetch notifications: ${
          err.response?.data?.error || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const groupedNotifications = () => {
    const notificationsWithDates = notifications
      .map((notification) => {
        const date = new Date(notification.createAt || new Date());
        return {
          ...notification,
          dateObj: date,
          dateString: isToday(date) ? "Today" : format(date, "dd/MM/yyyy"),
          timeString: format(date, "HH:mm:ss"),
          dateTimestamp: date.getTime(),
        };
      })
      .filter((notification) => {
        if (!selectedDate) return true;
        const selected = new Date(selectedDate);
        return (
          notification.dateObj.getFullYear() === selected.getFullYear() &&
          notification.dateObj.getMonth() === selected.getMonth() &&
          notification.dateObj.getDate() === selected.getDate()
        );
      });

    const groups = notificationsWithDates.reduce((acc, notification) => {
      if (!acc[notification.dateString]) {
        acc[notification.dateString] = {
          dateString: notification.dateString,
          timestamp: notification.dateTimestamp,
          items: [],
        };
      }
      acc[notification.dateString].items.push({
        ...notification,
        table: `Table ${notification.tableNumber || "Unknown"}`,
        time: notification.timeString,
        content: notification.content || "No content",
      });
      return acc;
    }, {});

    Object.keys(groups).forEach((key) => {
      groups[key].items.sort((a, b) => b.dateTimestamp - a.dateTimestamp);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.dateString === "Today") return -1;
      if (b.dateString === "Today") return 1;
      return b.timestamp - a.timestamp;
    });
  };

  const handleTabClick = (tab) => {
    if (tab === "Order Management") {
      navigate("/order-management");
    } else if (tab === "Dish Management") {
      navigate("/dish-management");
    } else {
      setActiveTab(tab);
    }
  };

  const handleCheckNotification = async (notification) => {
    try {
      setProcessing(true);
      const id = notification.notificationId;
      if (!id) {
        toast.error("Invalid notification ID");
        return;
      }

      if (notification.type === "PAYMENT_REQUEST") {
        if (!notification.orderId) {
          toast.error("Invalid order ID for payment confirmation");
          return;
        }

        const loadingToastId = toast.loading("Checking payment status...");

        const statusResponse = await getPaymentStatus(notification.orderId);
        if (statusResponse.error) {
          toast.update(loadingToastId, {
            render: `Failed to check payment status: ${statusResponse.message}`,
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
          return;
        }

        if (statusResponse.paymentStatus === "PAID") {
          toast.update(loadingToastId, {
            render: `Payment already confirmed for order ${notification.orderId}`,
            type: "info",
            isLoading: false,
            autoClose: 3000,
          });
          const readResponse = await markNotificationAsRead(id);
          if (readResponse.error) {
            toast.error("Failed to mark notification as read");
            return;
          }
          setNotifications((prev) =>
            prev.map((noti) =>
              noti.notificationId === id ? { ...noti, isRead: true } : noti
            )
          );
          return;
        }

        if (statusResponse.paymentStatus !== "PENDING") {
          toast.update(loadingToastId, {
            render: `No pending payment found for order ${notification.orderId}`,
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
          const readResponse = await markNotificationAsRead(id);
          if (readResponse.error) {
            toast.error("Failed to mark notification as read");
            return;
          }
          setNotifications((prev) =>
            prev.map((noti) =>
              noti.notificationId === id ? { ...noti, isRead: true } : noti
            )
          );
          return;
        }

        toast.update(loadingToastId, { render: "Confirming payment..." });
        const paymentResponse = await confirmPayment(notification.orderId);
        if (paymentResponse.success) {
          toast.update(loadingToastId, {
            render: "Payment confirmed successfully!",
            type: "success",
            isLoading: false,
            autoClose: 3000,
          });
        } else {
          toast.update(loadingToastId, {
            render: paymentResponse.message || "Failed to confirm payment",
            type: "error",
            isLoading: false,
            autoClose: 5000,
          });
          return;
        }
      }

      const readResponse = await markNotificationAsRead(id);
      if (readResponse.error) {
        toast.error("Failed to mark notification as read");
        return;
      }

      setNotifications((prev) =>
        prev.map((noti) =>
          noti.notificationId === id ? { ...noti, isRead: true } : noti
        )
      );

      if (notification.type !== "PAYMENT_REQUEST") {
        toast.success("Notification marked as read");
      }
    } catch (err) {
      console.error("Error processing notification:", err);
      toast.error(`Error processing notification: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteClick = (id) => {
    setNotificationToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (notificationToDelete) {
      setProcessing(true);
      try {
        const response = await deleteNotification(notificationToDelete);
        if (response.error) {
          toast.error("Failed to delete notification");
        } else {
          setNotifications((prev) =>
            prev.filter((noti) => noti.notificationId !== notificationToDelete)
          );
          toast.success("Notification deleted successfully");
        }
      } catch (err) {
        console.error("Error deleting notification:", err);
        toast.error("Error deleting notification");
      } finally {
        setProcessing(false);
        setShowDeleteModal(false);
        setNotificationToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setNotificationToDelete(null);
  };

  const getNotificationIcon = (type) => {
    if (!type) return <FaBell className="text-gray-500 mr-2 h-5 w-5" />;
    switch (type) {
      case "PAYMENT_REQUEST":
        return <FaMoneyBillWave className="text-green-500 mr-2 h-5 w-5" />;
      case "CALL_STAFF":
        return <FaBell className="text-blue-500 mr-2 h-5 w-5" />;
      case "ORDER_READY":
        return <FaUtensils className="text-orange-500 mr-2 h-5 w-5" />;
      default:
        return <FaBell className="text-gray-500 mr-2 h-5 w-5" />;
    }
  };

  const getButtonLabel = (notification) => {
    if (notification.isRead) return "Checked";
    if (notification.type === "PAYMENT_REQUEST") return "Confirm";
    return "Check";
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-blue-50 flex flex-col">
        <MenuBar
          title="Notification Management"
          icon="https://img.icons8.com/material-outlined/192/FFFFFF/alarm.png"
        />
        <div className="flex-1 p-6 bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-blue-50 flex flex-col">
        <MenuBar
          title="Notification Management"
          icon="https://img.icons8.com/material-outlined/192/FFFFFF/alarm.png"
        />
        <div className="flex-1 p-6 bg-gray-100 flex items-center justify-center">
          <div className="text-xl font-bold text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  const sortedNotificationGroups = groupedNotifications();

  return (
    <div className="h-screen w-screen !bg-blue-50 flex flex-col">
      <MenuBar
        title="Notification Management"
        icon="https://img.icons8.com/material-outlined/192/FFFFFF/alarm.png"
      />

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100 overflow-y-auto">
        {/* Date Filter */}
        <div className="mb-6">
          <label htmlFor="dateFilter" className="mr-2 font-medium">
            Filter by Date:
          </label>
          <input
            type="date"
            id="dateFilter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border rounded"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="ml-2 px-3 py-1 text-white rounded hover:bg-gray-600"
              style={{
                backgroundColor: "#FF6347",
              }}
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {sortedNotificationGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notifications available
            </div>
          ) : (
            sortedNotificationGroups.map((dateGroup) => (
              <div key={dateGroup.dateString} className="mb-8">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">
                  {dateGroup.dateString}
                </h2>
                {dateGroup.items.map((notification) => (
                  <div
                    key={notification.notificationId}
                    className="relative flex justify-between items-center bg-white rounded-lg shadow-md p-4 mb-4"
                  >
                    {/* Left side: Icon and info */}
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full mr-4">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">
                          {notification.table}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          - {notification.type}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {notification.content}
                        </p>
                      </div>
                    </div>

                    {/* Right side: Time and Buttons */}
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-gray-500 text-sm">
                        {notification.time}
                      </span>
                      <div className="flex justify-end space-x-4">
                        <button
                          aria-label={
                            notification.isRead
                              ? "Notification checked"
                              : "Mark notification as checked"
                          }
                          className={`flex items-center justify-center px-3 py-1 w-28 text-white rounded text-sm font-medium ${
                            notification.isRead
                              ? "!bg-green-500 cursor-not-allowed opacity-70"
                              : "!bg-yellow-500 hover:bg-green-600"
                          }`}
                          onClick={() =>
                            !notification.isRead &&
                            handleCheckNotification(notification)
                          }
                          disabled={notification.isRead}
                        >
                          <FaCheck className="mr-1 w-5 h-5" />
                          {notification.isRead ? "Checked" : "Check"}
                        </button>
                        <button
                          aria-label="Delete notification"
                          className="flex items-center justify-center px-3 py-1 w-28 !bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
                          onClick={() =>
                            handleDeleteClick(notification.notificationId)
                          }
                        >
                          <FaTrash className="mr-1 w-6 h-6" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
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
              />
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

export default NotificationManagementStaff;
