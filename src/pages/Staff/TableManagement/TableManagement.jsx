import React, { useState, useEffect, useCallback } from "react";
import MenuBarStaff from "../../../components/layout/MenuBar_Staff.jsx";
import MenuBar from "../../../components/layout/MenuBar.jsx";
import axios from "axios";
import { useMemo } from "react";

const TableManagementStaff = () => {
  const [selectedTable, setSelectedTable] = useState(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEmptyTableModalOpen, setIsEmptyTableModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [tableNotifications, setTableNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // New states for order data
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);

  //Web socket
  const [socket, setSocket] = useState(null);
  const [socketError, setSocketError] = useState(null);

  useEffect(() => {
    let ws;
    let reconnectTimeout;
    let isMounted = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 5000;

    const connectWebSocket = () => {
      if (!isMounted || reconnectAttempts >= maxReconnectAttempts) return;

      ws = new WebSocket("ws://localhost:8080/ws/notifications");

      ws.onopen = () => {
        console.log("WebSocket connected");
        setSocket(ws);
        setSocketError(null);
        reconnectAttempts = 0; // Reset số lần thử khi kết nối thành công
        clearTimeout(reconnectTimeout);
      };

      ws.onmessage = (event) => {
        try {
          if (typeof event.data !== "string") {
            throw new Error("Received non-string WebSocket message");
          }
          const notification = JSON.parse(event.data);
          if (!notification.notificationId || !notification.tableNumber) {
            throw new Error("Invalid notification format");
          }
          console.log("Received WebSocket notification:", notification);

          setTableNotifications((prev) => {
            const exists = prev.some(
              (n) => n.notificationId === notification.notificationId
            );
            if (exists) {
              return prev.map((n) =>
                n.notificationId === notification.notificationId
                  ? { ...n, ...notification }
                  : n
              );
            } else {
              return [...prev, notification];
            }
          });
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
          setSocketError("Failed to process notification");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setSocketError("Failed to connect to notifications server");
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setSocket(null);
        if (isMounted && reconnectAttempts < maxReconnectAttempts) {
          // Tăng delay theo cấp số nhân
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
          reconnectAttempts++;
          reconnectTimeout = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
        console.log("WebSocket closed during cleanup");
      }
    };
  }, []);

  // Set up axios interceptor for authentication
  useEffect(() => {
    // Add request interceptor
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // Get token from localStorage
        const token = localStorage.getItem("accessToken");

        // If token exists, add to headers
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 or 403 and we haven't retried yet
        if (
          (error.response?.status === 401 || error.response?.status === 403) &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;

          try {
            // Try to get a new token if you have a refresh token mechanism
            // const refreshToken = localStorage.getItem("refreshToken");
            // const response = await axios.post("/api/auth/refresh", { refreshToken });
            // localStorage.setItem("accessToken", response.data.accessToken);

            // Redirect to login if needed
            setAuthError("Your session has expired. Please log in again.");
            // Optional: redirect to login
            // window.location.href = "/login";

            return Promise.reject(error);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptors when component unmounts
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Calculate unread notifications by table
  const unreadNotificationsByTable = useMemo(() => {
    const result = tables.reduce((acc, table) => {
      acc[table.id] = tableNotifications.filter(
        (n) => n.tableNumber.toString() === table.id.toString() && !n.isRead
      ).length;
      return acc;
    }, {});
    console.log("unreadNotificationsByTable:", result);
    return result;
  }, [tableNotifications, tables]);

  // GraphQL request function
  const executeGraphQL = async (query, variables = {}) => {
    try {
      const response = await axios.post(
        "http://localhost:8080/graphql",
        {
          query,
          variables,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      return response.data.data;
    } catch (error) {
      console.error("GraphQL Error:", error);
      throw error;
    }
  };

  // API object for REST requests
  const API = {
    get: (url) => axios.get(`http://localhost:8080${url}`),
    post: (url, data) => axios.post(`http://localhost:8080${url}`, data),
    put: (url, data) => axios.put(`http://localhost:8080${url}`, data),
    delete: (url) => axios.delete(`http://localhost:8080${url}`),
  };

  // Fetch all orders using GraphQL
  const fetchOrdersGraphQL = useCallback(async () => {
    try {
      const query = `
        query GetAllOrders {
          orders {
            orderId
            customerName
            tableNumber
            status
            totalAmount
            paymentStatus
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

      const result = await executeGraphQL(query);

      if (!result || !result.orders) {
        throw new Error("Invalid GraphQL response structure");
      }

      return result.orders;
    } catch (err) {
      console.error("Error fetching orders via GraphQL:", err);
      throw err;
    }
  }, []);

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    setOrderLoading(true);
    setOrderError(null);

    try {
      const ordersData = await fetchOrdersGraphQL();
      console.log("Orders from GraphQL:", ordersData);
      setOrders(ordersData);

      setTables((prevTables) =>
        prevTables.map((table) => {
          const tableOrders = ordersData.filter(
            (order) => order.tableNumber?.toString() === table.id.toString()
          );
          return { ...table, orders: tableOrders };
        })
      );

      return ordersData;
    } catch (err) {
      console.error("GraphQL orders fetch failed:", err);
      try {
        const response = await API.get("/api/orders");
        console.log("Orders from REST:", response.data);
        setOrders(response.data);

        setTables((prevTables) =>
          prevTables.map((table) => {
            const tableOrders = response.data.filter(
              (order) => order.tableNumber?.toString() === table.id.toString()
            );
            return { ...table, orders: tableOrders };
          })
        );

        return response.data;
      } catch (restErr) {
        console.error("REST orders fetch also failed:", restErr);
        setOrderError("Failed to load orders data");
        return [];
      }
    } finally {
      setOrderLoading(false);
    }
  }, [fetchOrdersGraphQL]);

  // Fetch order by ID using GraphQL
  const fetchOrderByIdGraphQL = useCallback(async (orderId) => {
    try {
      const query = `
        query GetOrder($orderId: ID!) {
          order(orderId: $orderId) {
            orderId
            customerName
            tableNumber
            status
            totalAmount
            paymentStatus
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

      const variables = {
        orderId: orderId.toString(),
      };

      const result = await executeGraphQL(query, variables);

      if (!result || !result.order) {
        throw new Error("Invalid GraphQL response structure");
      }

      return result.order;
    } catch (err) {
      console.error(`Error fetching order ${orderId} via GraphQL:`, err);
      throw err;
    }
  }, []);

  // Fetch order by ID
  const fetchOrderById = useCallback(
    async (orderId) => {
      if (!orderId) {
        console.error("Cannot fetch order without orderId");
        setOrderError("Invalid order ID");
        return null;
      }

      setOrderLoading(true);
      setOrderError(null);

      try {
        // Try GraphQL first
        const orderData = await fetchOrderByIdGraphQL(orderId);
        setCurrentOrder(orderData);
        return orderData;
      } catch (err) {
        console.error("GraphQL order fetch failed:", err);

        try {
          // Fall back to REST API
          const response = await API.get(`/api/orders/${orderId}`);
          setCurrentOrder(response.data);
          return response.data;
        } catch (restErr) {
          console.error("REST order fetch also failed:", restErr);
          setOrderError(`Failed to load order #${orderId}`);
          return null;
        }
      } finally {
        setOrderLoading(false);
      }
    },
    [fetchOrderByIdGraphQL]
  );

  // Fetch orders by table ID
  const fetchOrdersByTableId = useCallback(async (tableId) => {
    if (!tableId) {
      console.error("Cannot fetch orders without tableId");
      setOrderError("Invalid table ID");
      return [];
    }

    setOrderLoading(true);
    setOrderError(null);

    try {
      // For now, there's no GraphQL endpoint for this specific operation,
      // so we'll use REST directly
      const response = await API.get(`/api/staff/tables/${tableId}`);
      return response.data || [];
    } catch (err) {
      console.error(`Error fetching orders for table ${tableId}:`, err);
      setOrderError(`Failed to load orders for table #${tableId}`);
      return [];
    } finally {
      setOrderLoading(false);
    }
  }, []);

  // Update order status using GraphQL
  const updateOrderStatusGraphQL = useCallback(async (orderId, status) => {
    try {
      const mutation = `
        mutation UpdateOrderStatus($orderId: ID!, $input: UpdateOrderStatusInput!) {
          updateOrderStatus(orderId: $orderId, input: $input)
        }
      `;

      const variables = {
        orderId: orderId.toString(),
        input: {
          status: status,
        },
      };

      const result = await executeGraphQL(mutation, variables);
      return result.updateOrderStatus;
    } catch (err) {
      console.error("Error updating order status with GraphQL:", err);
      throw err;
    }
  }, []);

  // Update order status
  const updateOrderStatus = useCallback(
    async (orderId, status) => {
      if (!orderId) {
        console.error("Cannot update order without orderId");
        setOrderError("Invalid order ID");
        return false;
      }

      setOrderLoading(true);
      setOrderError(null);

      try {
        // Try GraphQL first
        const result = await updateOrderStatusGraphQL(orderId, status);

        // Update local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.orderId === orderId ? { ...order, status } : order
          )
        );

        return result;
      } catch (err) {
        console.error("GraphQL order status update failed:", err);

        try {
          // Fall back to REST API
          const response = await API.put(`/api/orders/${orderId}/status`, {
            status,
          });

          // Update local state
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.orderId === orderId ? { ...order, status } : order
            )
          );

          return true;
        } catch (restErr) {
          console.error("REST order status update also failed:", restErr);
          setOrderError(`Failed to update status for order #${orderId}`);
          return false;
        }
      } finally {
        setOrderLoading(false);
      }
    },
    [updateOrderStatusGraphQL]
  );

  // Delete order using GraphQL
  const deleteOrderGraphQL = useCallback(async (orderId) => {
    try {
      const mutation = `
      mutation DeleteOrder($orderId: String!) {
        deleteOrder(orderId: $orderId)
      }
    `;

      const variables = {
        orderId: orderId.toString(),
      };

      const result = await executeGraphQL(mutation, variables);

      if (!result || !result.deleteOrder) {
        throw new Error("Invalid GraphQL response structure");
      }

      return result.deleteOrder;
    } catch (err) {
      console.error(`Error deleting order ${orderId} via GraphQL:`, err);
      throw err;
    }
  }, []);

  // Delete order
  const deleteOrder = useCallback(
    async (orderId) => {
      if (!orderId) {
        console.error("Cannot delete order without orderId");
        setOrderError("Invalid order ID");
        return false;
      }

      setOrderLoading(true);
      setOrderError(null);

      try {
        // Gọi mutation deleteOrder qua GraphQL
        await deleteOrderGraphQL(orderId);

        // Làm mới danh sách orders
        const updatedOrders = await fetchOrders();

        // Cập nhật selectedTable.orders nếu đang mở modal
        if (selectedTable) {
          const tableOrders = updatedOrders.filter(
            (order) =>
              order.tableNumber.toString() === selectedTable.id.toString()
          );
          setSelectedTable((prev) => ({
            ...prev,
            orders: tableOrders,
          }));
        }

        // Làm mới danh sách tables qua REST API
        const response = await API.get("/api/staff/tables");
        if (response.data) {
          const mappedTables = response.data.map((table) => ({
            id: table.table_id,
            status: table.status?.toLowerCase() || "available",
            capacity: table.capacity,
            orders: [],
          }));
          setTables(mappedTables);
        }

        return true;
      } catch (err) {
        console.error(`Failed to delete order #${orderId}:`, err);
        setOrderError(`Failed to delete order #${orderId}`);
        return false;
      } finally {
        setOrderLoading(false);
      }
    },
    [deleteOrderGraphQL, fetchOrders, selectedTable]
  );

  // Fetch tables when component mounts
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);

        const response = await API.get("/api/staff/tables");
        if (!response.data) {
          throw new Error("No tables data returned from API");
        }

        const mappedTables = response.data.map((table) => ({
          id: table.table_id,
          status: table.status?.toLowerCase() || "available",
          capacity: table.capacity,
          orders: [],
        }));

        setTables(mappedTables);
        await fetchOrders();
      } catch (err) {
        console.error("Error fetching tables:", err);
        if (err.response?.status === 403) {
          setError(
            "You don't have permission to access this resource. Please check your authentication."
          );
        } else {
          setError("Failed to load tables. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTables();
  }, [fetchOrders]);

  // Fetch notifications when tables are updated
  useEffect(() => {
    if (tables.length > 0) {
      fetchAllNotifications();
    }
  }, [tables]);

  const ordersByTable = useMemo(() => {
    return orders.reduce((acc, order) => {
      if (order.tableNumber) {
        const tableId = order.tableNumber.toString();
        if (!acc[tableId]) {
          acc[tableId] = [];
        }
        acc[tableId].push(order);
      }
      return acc;
    }, {});
  }, [orders]);

  useEffect(() => {
    if (orders.length === 0 || tables.length === 0) return;

    const updatedTables = tables.map((table) => {
      const tableId = table.id.toString();
      const tableOrders = ordersByTable[tableId] || [];
      let updatedStatus = table.status;

      console.log(`Table ${tableId}:`, {
        orders: tableOrders,
        currentStatus: table.status,
      });

      if (tableOrders.length === 0) {
        updatedStatus = "available";
      } else {
        // Check if ANY orders for this table are unpaid
        const hasUnpaidOrders = tableOrders.some(
          (order) => order.paymentStatus?.toUpperCase() !== "PAID"
        );

        if (hasUnpaidOrders) {
          updatedStatus = "occupied";
        } else {
          updatedStatus = "available";
        }
      }

      if (
        updatedStatus !== table.status ||
        JSON.stringify(table.orders) !== JSON.stringify(tableOrders)
      ) {
        return {
          ...table,
          status: updatedStatus,
          orders: tableOrders,
        };
      }
      return table;
    });

    if (JSON.stringify(updatedTables) !== JSON.stringify(tables)) {
      setTables(updatedTables);
    }
  }, [ordersByTable, tables]);

  // Function to fetch notifications for a specific table
  const fetchTableNotifications = async (tableId) => {
    if (!tableId) {
      console.error("Cannot fetch notifications for undefined table ID");
      setNotificationsError("Invalid table selected");
      return;
    }

    try {
      setNotificationsLoading(true);
      setNotificationsError(null);

      // Fetch notifications for the specific table
      const response = await API.get(`/api/notifications/table/${tableId}`);
      const notifications = response.data;

      // Update tableNotifications by replacing notifications for this table
      setTableNotifications((prev) => {
        // Keep notifications for other tables
        const otherNotifications = prev.filter(
          (n) => n.tableNumber !== tableId
        );
        // Add new notifications for this table
        return [...otherNotifications, ...notifications];
      });
    } catch (err) {
      console.error(`Error fetching notifications for table ${tableId}:`, err);
      setNotificationsError("Failed to load notifications. Please try again.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    if (!notificationId) {
      console.error("Cannot mark undefined notification as read");
      return;
    }

    try {
      await API.put(`/api/notifications/${notificationId}/read`);

      // Update local state to mark notification as read
      setTableNotifications(
        tableNotifications.map((notification) =>
          notification.notificationId === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error(
        `Error marking notification ${notificationId} as read:`,
        err
      );
    }
  };

  // Open notification modal and fetch notifications for that table
  const toggleNotificationModal = async (e, table) => {
    e.stopPropagation();
    if (!table || !table.id) {
      console.error("Cannot toggle notification modal for undefined table");
      return;
    }

    setSelectedTable(table);
    setCurrentPage(1); // Reset to first page

    // Only fetch notifications if we're opening the modal
    if (!isNotificationModalOpen) {
      await fetchTableNotifications(table.id);
    }

    setIsNotificationModalOpen(!isNotificationModalOpen);
  };

  const handleSelectTable = async (table) => {
    setSelectedTable(table);

    // If table is occupied, fetch orders for it
    if (table.status === "occupied") {
      const tableOrders = await fetchOrdersByTableId(table.id);

      // Update the selected table with the orders
      setSelectedTable((prev) => ({
        ...prev,
        orders: tableOrders,
      }));
    }
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
    if (!selectedTable || !selectedTable.id) {
      console.error("Cannot update status for undefined table");
      return;
    }

    try {
      // Update table status
      await API.put(`/api/staff/tables/${selectedTable.id}`, {
        status: "AVAILABLE",
      });

      // Update orders payment status
      if (selectedTable.orders && selectedTable.orders.length > 0) {
        for (const order of selectedTable.orders) {
          try {
            await API.put(`/api/orders/${order.orderId}/payment`, {
              paymentStatus: "PAID",
            });
          } catch (err) {
            console.error(
              `Error updating payment for order ${order.orderId}:`,
              err
            );
          }
        }
      }

      // Update local state
      setTables((prevTables) =>
        prevTables.map((table) =>
          table.id === selectedTable.id
            ? { ...table, status: "available", orders: [] }
            : table
        )
      );

      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Error updating table status:", err);
      // Show payment success anyway, but log the error
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
    }
  };

  const handleShowEmptyTableModal = () => {
    setIsEmptyTableModalOpen(true);
  };

  const handlePrintReceipt = () => {
    setIsBillModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  // Calculate total from order items
  const calculateTotalFromOrders = (orders) => {
    if (!orders || orders.length === 0) return 0;

    return orders.reduce((sum, order) => {
      return sum + (parseFloat(order.totalAmount) || 0);
    }, 0);
  };

  // Calculate total from order items
  const totalAmount = selectedTable?.orders
    ? calculateTotalFromOrders(selectedTable.orders)
    : 0;

  const emptyTables = tables.filter((table) => table.status === "available");

  // Example of a properly rendering list that uses unique keys
  const renderTableList = () => {
    if (loading) return <div className="loading">Loading tables...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
      <div className="tables-grid">
        {tables.map((table) => (
          <div
            key={`table-${table.id}`}
            className={`table-item ${table.status}`}
            onClick={() => handleSelectTable(table)}
          >
            <h3>Table {table.id}</h3>
            <p>Status: {table.status}</p>
            <p>Capacity: {table.capacity}</p>

            {/* Show notification bell icon */}
            <button
              onClick={(e) => toggleNotificationModal(e, table)}
              className="notification-button"
            >
              🔔
            </button>

            {table.orders && table.orders.length > 0 && (
              <div className="table-orders">
                <h4>Orders:</h4>
                <ul>
                  {table.orders.map((order) => (
                    <li key={order.orderId}>
                      Order #{order.orderId}: {order.status}
                      {order.items && order.items.length > 0 && (
                        <ul>
                          {order.items.map((item, index) => (
                            <li key={`${order.orderId}-item-${index}`}>
                              {item.dishName} x {item.quantity}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const itemsPerPage = 5;
    const totalPages = Math.ceil(tableNotifications.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [tableNotifications, currentPage]);

  const renderNotificationModal = () => {
    if (!isNotificationModalOpen || !selectedTable) return null;

    const itemsPerPage = 5;
    // Filter notifications for the selected table
    const tableSpecificNotifications = tableNotifications.filter(
      (notification) => notification.tableNumber === selectedTable.id
    );
    const totalPages = Math.ceil(
      tableSpecificNotifications.length / itemsPerPage
    );

    // Sort notifications by creation date (newest first)
    const sortedNotifications = [...tableSpecificNotifications].sort(
      (a, b) => new Date(b.createAt) - new Date(a.createAt)
    );
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentNotifications = sortedNotifications.slice(
      indexOfFirstItem,
      indexOfLastItem
    );

    // Format date and time
    const formatDateTime = (isoString) => {
      try {
        const date = new Date(isoString);
        return date.toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch {
        return "Invalid date";
      }
    };

    // Pagination buttons
    const getPaginationButtons = () => {
      const maxButtons = 5;
      const buttons = [];
      let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
      let endPage = Math.min(totalPages, startPage + maxButtons - 1);

      if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        buttons.push(
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            className={`px-3 py-1 rounded ${
              currentPage === i
                ? "!bg-blue-400 text-white"
                : "text-blue-600 hover:bg-blue-100"
            }`}
          >
            {i}
          </button>
        );
      }

      return buttons;
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-auto p-6 flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-semibold">
              Notifications for Table {selectedTable.id}
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {notificationsLoading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">
                  Loading notifications...
                </span>
              </div>
            )}

            {notificationsError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {notificationsError}
              </div>
            )}

            {!notificationsLoading && !notificationsError && (
              <>
                {currentNotifications.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No notifications for this table
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {currentNotifications.map((notification) => (
                      <li
                        key={notification.notificationId}
                        className={`py-4 ${
                          !notification.isRead ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-800">
                              {notification.title}
                            </h3>
                            <p className="mt-1 text-gray-600">
                              {notification.content}
                            </p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(notification.createAt)}
                          </span>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() =>
                              markNotificationAsRead(
                                notification.notificationId
                              )
                            }
                            className="!bg-blue-600 mt-2 text-sm text-white hover:bg-blue-700 font-medium py-1 px-3 rounded"
                          >
                            Mark as Read
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* Pagination */}
          {!notificationsLoading && !notificationsError && (
            <div className="mt-4 pt-3 border-t">
              {tableSpecificNotifications.length > 0 && (
                <div className="text-center text-sm text-gray-600 mb-2">
                  Page {currentPage} / {totalPages} (
                  {tableSpecificNotifications.length} notifications)
                </div>
              )}
              {tableSpecificNotifications.length > itemsPerPage && (
                <div className="flex justify-center items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    First
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    «
                  </button>
                  {getPaginationButtons()}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    »
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    Last
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setIsNotificationModalOpen(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render dish details modal
  const renderDishModal = () => {
    if (!isDishModalOpen || !selectedTable) return null;

    return (
      <div className="dish-modal">
        <div className="modal-content">
          <h2>Table {selectedTable.id} Orders</h2>

          {orderLoading && <p>Loading order details...</p>}
          {orderError && <p className="error">{orderError}</p>}

          {!orderLoading && !orderError && selectedTable.orders && (
            <>
              {selectedTable.orders.length === 0 ? (
                <p>No orders for this table</p>
              ) : (
                <div>
                  {selectedTable.orders.map((order) => (
                    <div key={order.orderId} className="order-details">
                      <h3>Order #{order.orderId}</h3>
                      <p>Status: {order.status}</p>
                      <p>Customer: {order.customerName}</p>

                      <h4>Items:</h4>
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Dish</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items &&
                            order.items.map((item, index) => (
                              <tr key={`${order.orderId}-item-${index}`}>
                                <td>{item.dishName}</td>
                                <td>{item.quantity}</td>
                                <td>${parseFloat(item.price).toFixed(2)}</td>
                                <td>{item.notes || "—"}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>

                      <p className="order-total">
                        Total: ${parseFloat(order.totalAmount).toFixed(2)}
                      </p>

                      {/* Nút xóa đơn hàng */}
                      <button
                        onClick={() => deleteOrder(order.orderId)}
                        className="delete-order-btn"
                      >
                        Delete Order
                      </button>
                    </div>
                  ))}

                  <p className="table-total">
                    Table Total: ${totalAmount.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="modal-actions">
                <button
                  onClick={handleShowPaymentModal}
                  className="payment-btn"
                >
                  Process Payment
                </button>
                <button
                  onClick={() => setIsDishModalOpen(false)}
                  className="close-modal-btn"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render payment modal
  const renderPaymentModal = () => {
    if (!isPaymentModalOpen || !selectedTable) return null;

    return (
      <div className="payment-modal">
        <div className="modal-content">
          <h2>Process Payment for Table {selectedTable.id}</h2>

          <div className="payment-details">
            <p>Total Amount: ${totalAmount.toFixed(2)}</p>

            <div className="payment-method">
              <h3>Payment Method</h3>
              <div className="payment-options">
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    defaultChecked
                  />
                  Cash
                </label>
                <label>
                  <input type="radio" name="paymentMethod" value="card" />
                  Credit/Debit Card
                </label>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              onClick={handlePaymentSuccess}
              className="confirm-payment-btn"
            >
              Confirm Payment
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className="close-modal-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render success modal
  const renderSuccessModal = () => {
    if (!isSuccessModalOpen) return null;

    return (
      <div className="success-modal">
        <div className="modal-content">
          <h2>Payment Successful</h2>
          <p>
            Table {selectedTable?.id} has been cleared and is now available.
          </p>

          <button
            onClick={() => setIsSuccessModalOpen(false)}
            className="close-modal-btn"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const fetchAllNotifications = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);

      const notificationsPromises = tables.map((table) =>
        API.get(`/api/notifications/table/${table.id}`)
          .then((response) => {
            console.log(`Notifications for table ${table.id}:`, response.data);
            return response.data;
          })
          .catch((err) => {
            console.error(
              `Error fetching notifications for table ${table.id}:`,
              err
            );
            return [];
          })
      );

      const notificationsArrays = await Promise.all(notificationsPromises);
      const allNotifications = notificationsArrays
        .flat()
        .filter((n) => n.notificationId && typeof n.isRead === "boolean");

      console.log("All notifications:", allNotifications);
      setTableNotifications(allNotifications);
    } catch (err) {
      console.error("Error fetching all notifications:", err);
      setNotificationsError("Failed to load notifications");
      setTableNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // This is the updated return part of the component, integrating the missing functions
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
        <MenuBar
          title="Table Management"
          icon="https://img.icons8.com/ios-filled/50/FFFFFF/table.png"
        />

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
                          {table.orders && table.orders.length > 0
                            ? `Dish ${
                                table.orders.filter(
                                  (d) =>
                                    d.status === "Complete" ||
                                    d.status === "COMPLETE"
                                ).length
                              }/${table.orders.length}`
                            : "No orders"}
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
                          {notificationsLoading ? (
                            <span className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                              ...
                            </span>
                          ) : unreadNotificationsByTable[table.id] > 0 ? (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                              {unreadNotificationsByTable[table.id]}
                            </span>
                          ) : null}
                        </div>
                      </div>
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

      {/* Notification Modal - Updated to use tableNotifications */}
      {isNotificationModalOpen && selectedTable && renderNotificationModal()}

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
                Table {selectedTable.id} - Staff
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsDishModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {selectedTable.Staff.map((dish, index) => (
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
                className="!bg-blue-500 text-white px-4 py-2 rounded-lg"
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
                  {selectedTable.Staff.map((dish, index) => (
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
                  {selectedTable.Staff.map((dish, index) => (
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

export default TableManagementStaff;
