import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isOffTable } from "../../../utils/reservation";
import MenuBar from "../../../components/layout/MenuBar.jsx";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import ManualOrderModal from "../../../components/order/ManualOrderModal";
import ReservationManager from "../../../components/reservation/ReservationManager";
import usePendingReservationCount from "../../../components/reservation/usePendingReservationCount";

import { BACKEND_URL, BACKEND_WS_URL, authHeaders } from "../../../config";

const formatVND = (amount) => {
  const num = Number(amount) || 0;
  return `${num.toLocaleString("vi-VN")}đ`;
};
const TableManagementAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuContainerRef = useRef(null);

  const [selectedTable, setSelectedTable] = useState(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEmptyTableModalOpen, setIsEmptyTableModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isEditTableModalOpen, setIsEditTableModalOpen] = useState(false);
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [newTableCapacity, setNewTableCapacity] = useState("");
  const [newTableNumber, setNewTableNumber] = useState("");
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservationRefreshKey, setReservationRefreshKey] = useState(0);
  const pendingReservationCount = usePendingReservationCount(reservationRefreshKey);
  const [errorMessage, setErrorMessage] = useState("");
  const [editTableData, setEditTableData] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [tableNotifications, setTableNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [socketError, setSocketError] = useState(null);
  const [newTableId, setNewTableId] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [qrError, setQrError] = useState(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [lastWebSocketUpdate, setLastWebSocketUpdate] = useState(null);
  const [isTransferTableModalOpen, setIsTransferTableModalOpen] =
    useState(false);
  const [isTransferConfirmModalOpen, setIsTransferConfirmModalOpen] =
    useState(false);
  const [isTransferSuccessModalOpen, setIsTransferSuccessModalOpen] =
    useState(false);
  const [transferSourceTable, setTransferSourceTable] = useState(null);
  const [transferDestinationTable, setTransferDestinationTable] =
    useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAvailableListModal, setShowAvailableListModal] = useState(false);
  const [actionSuccessText, setActionSuccessText] = useState("");

  const userId = localStorage.getItem("userId") || "1";
  const tablesPerPage = 6;

  // Nhúng font tiếng Việt chuẩn, rõ dấu, không bị vỡ chữ
  useEffect(() => {
    const fontId = "bon-appetit-clean-vi-fonts";
    if (!document.getElementById(fontId)) {
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Lexend:wght@500;600;700&display=swap&subset=vietnamese";
      document.head.appendChild(link);
    }
  }, []);

  // Chuẩn hóa chữ tiếng Việt cho các phần tử bên trong MenuBar nếu component gốc có text tiếng Anh
  useEffect(() => {
    const translateMap = {
      "Table Management": "Quản lý bàn",
      Tables: "Quản lý bàn",
      Menu: "Thực đơn",
      "Menu Management": "Quản lý thực đơn",
      Orders: "Đơn hàng",
      "Order Management": "Quản lý đơn hàng",
      Staff: "Nhân sự",
      "Staff Management": "Quản lý nhân sự",
      Attendance: "Chấm công",
      Reports: "Báo cáo",
      Statistics: "Thống kê",
      Logout: "Đăng xuất",
      "Sign Out": "Đăng xuất",
      Profile: "Hồ sơ",
      Settings: "Cài đặt",
    };

    const el = menuContainerRef.current;
    if (!el) return;

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const raw = node.nodeValue?.trim();
      if (raw && translateMap[raw]) {
        node.nodeValue = node.nodeValue.replace(raw, translateMap[raw]);
      }
    }
  }, [tables, location.pathname]);

  // WebSocket Setup
  useEffect(() => {
    let ws;
    let reconnectTimeout;
    let isMounted = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 3000;

    const connectWebSocket = () => {
      if (!isMounted || reconnectAttempts >= maxReconnectAttempts) {
        console.log("Max reconnect attempts reached or component unmounted");
        setSocketError("Đã đạt giới hạn kết nối lại WebSocket");
        return;
      }

      console.log(
        `Attempting WebSocket connection for ADMIN (Attempt ${
          reconnectAttempts + 1
        })`,
      );
      ws = new WebSocket(
        `${BACKEND_WS_URL}/ws/notifications?userType=ADMIN&userId=${userId}`,
      );

      ws.onopen = () => {
        console.log("WebSocket connected successfully for ADMIN");
        setSocket(ws);
        setSocketError(null);
        reconnectAttempts = 0;
        clearTimeout(reconnectTimeout);
        fetchAllNotifications();
      };

      ws.onmessage = (event) => {
        try {
          if (typeof event.data !== "string") {
            throw new Error("Received non-string WebSocket message");
          }
          if (event.data === "PONG") {
            console.log("Received PONG from server for ADMIN");
            return;
          }
          const message = JSON.parse(event.data);
          console.log(
            "Received WebSocket message for ADMIN:",
            JSON.stringify(message, null, 2),
          );

          if (message.type === "PAYMENT_STATUS_UPDATED" && message.orderId) {
            setOrders((prev) => {
              const updatedOrders = prev.map((order) =>
                Number(order.orderId) === Number(message.orderId)
                  ? {
                      ...order,
                      paymentStatus: message.paymentStatus?.toUpperCase(),
                    }
                  : order,
              );
              console.log("Updated orders via WebSocket:", updatedOrders);
              return updatedOrders;
            });

            if (message.tableNumber && message.tableStatus) {
              setTables((prevTables) => {
                const updatedTables = prevTables.map((table) =>
                  Number(table.id) === Number(message.tableNumber)
                    ? {
                        ...table,
                        status: message.tableStatus.toLowerCase(),
                        orders: table.orders.map((order) =>
                          Number(order.orderId) === Number(message.orderId)
                            ? {
                                ...order,
                                paymentStatus:
                                  message.paymentStatus?.toUpperCase(),
                              }
                            : order,
                        ),
                      }
                    : table,
                );
                console.log(
                  `Updated table ${message.tableNumber} status to ${message.tableStatus} for order ${message.orderId} via WebSocket`,
                );
                return updatedTables;
              });
              setLastWebSocketUpdate(Date.now());
            } else {
              console.warn(
                "Table info missing in PAYMENT_STATUS_UPDATED message, fetching tables",
              );
              fetchTables();
            }
          } else if (message.type === "NEW_ORDER" && message.order) {
            setOrders((prev) => {
              const orderExists = prev.some(
                (o) => Number(o.orderId) === Number(message.order.orderId),
              );
              if (!orderExists) {
                console.log("Added new order via WebSocket:", message.order);
                return [...prev, message.order];
              }
              return prev;
            });
            fetchTables();
          } else if (message.type === "TABLE_ADDED" && message.table) {
            setTables((prev) => {
              const tableExists = prev.some(
                (t) => Number(t.id) === Number(message.table.table_id),
              );
              if (!tableExists) {
                const newTable = {
                  id: message.table.table_id,
                  status: message.table.status?.toLowerCase() || "available",
                  capacity: message.table.capacity,
                  orders: [],
                  location: message.table.location,
                  qrCode: message.table.qrCode,
                };
                console.log("Added new table via WebSocket:", newTable);
                return [...prev, newTable];
              }
              return prev;
            });
            fetchAllNotifications();
          } else if (message.type === "TABLE_UPDATED" && message.table) {
            setTables((prev) =>
              prev.map((table) =>
                Number(table.id) === Number(message.table.table_id)
                  ? {
                      ...table,
                      status:
                        message.table.status?.toLowerCase() || "available",
                      capacity: message.table.capacity,
                      location: message.table.location,
                      qrCode: message.table.qrCode,
                    }
                  : table,
              ),
            );
            console.log("Updated table via WebSocket:", message.table);
            fetchAllNotifications();
          } else if (
            message.notificationId &&
            message.tableNumber !== undefined
          ) {
            setTableNotifications((prev) => {
              const exists = prev.some(
                (n) => n.notificationId === message.notificationId,
              );
              if (exists) {
                console.log(`Updating notification ${message.notificationId}`);
                return prev.map((n) =>
                  n.notificationId === message.notificationId
                    ? { ...n, ...message }
                    : n,
                );
              } else {
                console.log(
                  `Adding new notification ${message.notificationId}`,
                );
                return [...prev, message];
              }
            });
          } else {
            console.warn("Unrecognized WebSocket message for ADMIN:", message);
            fetchTables();
            fetchOrders();
          }
        } catch (err) {
          console.error("Error processing WebSocket message for ADMIN:", err);
          setSocketError("Không thể xử lý thông báo thời gian thực");
          fetchTables();
          fetchOrders();
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error for ADMIN:", error);
        setSocketError("Không thể kết nối tới máy chủ thông báo");
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected for ADMIN");
        setSocket(null);
        if (isMounted && reconnectAttempts < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
          reconnectAttempts++;
          console.log(
            `Scheduling reconnect in ${delay}ms (Attempt ${reconnectAttempts})`,
          );
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        }
      };

      const pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          console.log("Sending PING for ADMIN");
          ws.send(JSON.stringify({ type: "PING" }));
        }
      }, 30000);

      return () => {
        clearInterval(pingInterval);
      };
    };

    connectWebSocket();

    const syncInterval = setInterval(() => {
      if (isMounted && tables.length > 0) {
        console.log("Performing periodic notification sync for ADMIN");
        fetchUnreadNotifications();
      }
    }, 120000);

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      clearInterval(syncInterval);
      if (ws) {
        console.log("Closing WebSocket during cleanup for ADMIN");
        ws.close();
      }
    };
  }, [tables, userId]);

  // Axios Interceptors
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          (error.response?.status === 401 || error.response?.status === 403) &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          setAuthError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          return Promise.reject(error);
        }
        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // API Configuration
  const API = {
    get: (url) => axios.get(`${BACKEND_URL}${url}`),
    post: (url, data) => axios.post(`${BACKEND_URL}${url}`, data),
    put: (url, data) => axios.put(`${BACKEND_URL}${url}`, data),
    delete: (url) => axios.delete(`${BACKEND_URL}${url}`),
  };

  // GraphQL Executor
  const executeGraphQL = async (query, variables = {}) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/graphql`,
        { query, variables },
        { headers: { "Content-Type": "application/json", ...authHeaders() } },
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

  // Fetch Orders
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
              status
            }
          }
        }
      `;
      const result = await executeGraphQL(query);
      if (!result || !result.orders) {
        throw new Error("Invalid GraphQL response structure");
      }
      // Lịch hẹn chưa nhận khách và đơn đã hủy không thuộc về bàn: không hiện, không tính tiền
      return result.orders.filter((order) => !isOffTable(order));
    } catch (err) {
      console.error("Error fetching orders via GraphQL:", err);
      throw err;
    }
  }, []);

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
            (order) => order.tableNumber?.toString() === table.id.toString(),
          );
          return { ...table, orders: tableOrders };
        }),
      );

      return ordersData;
    } catch (err) {
      console.error("GraphQL orders fetch failed:", err);
      try {
        const response = await API.get("/api/orders");
        response.data = (response.data || []).filter(
          (order) => !isOffTable(order)
        );
        console.log("Orders from REST:", response.data);
        setOrders(response.data);

        setTables((prevTables) =>
          prevTables.map((table) => {
            const tableOrders = response.data.filter(
              (order) => order.tableNumber?.toString() === table.id.toString(),
            );
            return { ...table, orders: tableOrders };
          }),
        );

        return response.data;
      } catch (restErr) {
        console.error("REST orders fetch also failed:", restErr);
        setOrderError("Không thể tải dữ liệu đơn hàng");
        return [];
      }
    } finally {
      setOrderLoading(false);
    }
  }, [fetchOrdersGraphQL]);

  // Fetch Unpaid Orders by Table
  const fetchUnpaidOrdersByTable = useCallback(
    async (tableId) => {
      if (!tableId) {
        console.error("Cannot fetch orders without tableId");
        setOrderError("Mã bàn không hợp lệ");
        return [];
      }

      setOrderLoading(true);
      setOrderError(null);

      try {
        const ordersData = await fetchOrdersGraphQL();
        if (!ordersData) {
          console.error("fetchOrdersGraphQL returned null or undefined");
          return [];
        }
        const unpaidOrders = ordersData.filter(
          (order) =>
            order.tableNumber?.toString() === tableId.toString() &&
            order.paymentStatus?.toUpperCase() === "UNPAID",
        );
        console.log(`Unpaid orders for table ${tableId}:`, unpaidOrders);
        return unpaidOrders || [];
      } catch (err) {
        console.error(
          `Error fetching unpaid orders for table ${tableId}:`,
          err,
        );
        setOrderError(`Không thể tải đơn chưa thanh toán của bàn #${tableId}`);
        return [];
      } finally {
        setOrderLoading(false);
      }
    },
    [fetchOrdersGraphQL],
  );

  // Fetch Tables
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get("/api/admin/tables");
      if (!response.data) {
        throw new Error("No tables data returned from API");
      }

      const mappedTables = response.data.map((table) => ({
        id: table.table_id,
        status: table.status?.toLowerCase() || "available",
        capacity: table.capacity,
        nextReservationTime: table.nextReservationTime || null,
        orders: [],
        location: table.location,
        qrCode: table.qrCode,
      }));

      setTables((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(mappedTables)) {
          return mappedTables;
        }
        return prev;
      });
      await fetchOrders();
    } catch (err) {
      console.error("Error fetching tables:", err);
      setError(
        err.response?.status === 403
          ? "Bạn không có quyền truy cập vào tài nguyên này."
          : "Không thể tải danh sách bàn. Vui lòng thử lại sau.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  const isDishPending = (status) => {
    const normalized = (status || "PENDING").toString().toUpperCase().trim();
    return [
      "PENDING",
      "WAITING",
      "NEW",
      "ORDERED",
      "CHUA_LAM",
      "CHƯA LÀM",
      "CHỜ LÀM",
      "CHỜ XỬ LÝ",
    ].includes(normalized);
  };

  // Tăng giảm số lượng món tính toán trực tiếp trên giao diện (phép tính thông thường, chưa cần gọi API)
  const handleUpdateDishQuantity = (orderId, dishId, item, newQuantity) => {
    if (
      newQuantity < 1 ||
      !isDishPending(item.status || item.itemStatus || item.cookingStatus)
    )
      return;
    setOrderError(null);
    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.orderId !== orderId) return ord;
        const updatedItems = (ord.items || []).map((it) => {
          const itId = it.dishId || it.id;
          const targetId = dishId || item.dishId || item.id;
          if (itId === targetId && it.dishName === item.dishName) {
            return { ...it, quantity: newQuantity };
          }
          return it;
        });
        const newTotal = updatedItems.reduce(
          (sum, it) =>
            sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
          0,
        );
        return { ...ord, items: updatedItems, totalAmount: newTotal };
      }),
    );
  };

  // Hủy món ăn cập nhật trực tiếp trên giao diện
  const handleCancelDishItem = (orderId, dishId, item) => {
    if (!isDishPending(item.status || item.itemStatus || item.cookingStatus))
      return;
    if (
      !window.confirm(
        `Xác nhận hủy món "${item.dishName}" khỏi đơn #${orderId}?`,
      )
    )
      return;
    setOrderError(null);
    setOrders((prevOrders) =>
      prevOrders.map((ord) => {
        if (ord.orderId !== orderId) return ord;
        const updatedItems = (ord.items || []).filter((it) => {
          const itId = it.dishId || it.id;
          const targetId = dishId || item.dishId || item.id;
          return !(itId === targetId && it.dishName === item.dishName);
        });
        const newTotal = updatedItems.reduce(
          (sum, it) =>
            sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
          0,
        );
        return { ...ord, items: updatedItems, totalAmount: newTotal };
      }),
    );
  };

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // Notification Functions
  const fetchTableNotifications = async (tableId) => {
    if (!tableId) {
      console.error("Cannot fetch notifications for undefined table ID");
      setNotificationsError("Chưa chọn bàn hợp lệ");
      return;
    }

    try {
      setNotificationsLoading(true);
      setNotificationsError(null);

      const response = await API.get(`/api/notifications/table/${tableId}`);
      console.log(`Fetched notifications for table ${tableId}:`, response.data);
      const notifications = response.data;

      setTableNotifications((prev) => {
        const otherNotifications = prev.filter(
          (n) => n.tableNumber !== tableId,
        );
        return [...otherNotifications, ...notifications];
      });
    } catch (err) {
      console.error(`Error fetching notifications for table ${tableId}:`, err);
      setNotificationsError(
        "Không thể tải thông báo của bàn. Vui lòng thử lại.",
      );
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError(null);

      const notificationsPromises = tables.map((table) =>
        API.get(`/api/notifications/table/${table.id}`)
          .then((response) => {
            console.log(`Notifications for table ${table.id}:`, response.data);
            return response.data.filter((n) => !n.isRead);
          })
          .catch((err) => {
            console.error(
              `Error fetching notifications for table ${table.id}:`,
              err,
            );
            return [];
          }),
      );

      const notificationsArrays = await Promise.all(notificationsPromises);
      const allNotifications = notificationsArrays
        .flat()
        .filter((n) => n.notificationId && typeof n.isRead === "boolean");

      console.log("Fetched unread notifications:", allNotifications);
      setTableNotifications((prev) => {
        const notificationMap = new Map();
        [...prev, ...allNotifications].forEach((n) => {
          notificationMap.set(n.notificationId, n);
        });
        return Array.from(notificationMap.values());
      });
    } catch (err) {
      console.error("Error fetching unread notifications:", err);
      setNotificationsError("Không thể tải thông báo chưa đọc");
    } finally {
      setNotificationsLoading(false);
    }
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
              err,
            );
            return [];
          }),
      );

      const notificationsArrays = await Promise.all(notificationsPromises);
      const allNotifications = notificationsArrays
        .flat()
        .filter((n) => n.notificationId && typeof n.isRead === "boolean");

      console.log("All notifications fetched:", allNotifications);
      setTableNotifications(allNotifications);
    } catch (err) {
      console.error("Error fetching all notifications:", err);
      setNotificationsError("Không thể tải danh sách thông báo");
      setTableNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (!notificationId) {
      console.error("Cannot mark undefined notification as read");
      return;
    }

    try {
      console.log(`Marking notification ${notificationId} as read`);
      setTableNotifications((prev) =>
        prev.map((notification) =>
          notification.notificationId === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
      await API.put(`/api/notifications/${notificationId}/read`);
    } catch (err) {
      console.error(
        `Error marking notification ${notificationId} as read:`,
        err,
      );
      setNotificationsError("Không thể đánh dấu thông báo đã đọc");
      fetchUnreadNotifications();
    }
  };

  // Create Table
  const handleAddTableSuccess = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setQrError(null);
    try {
      const response = await API.post("/api/admin/tables", {
        tableNumber: parseInt(newTableNumber),
        capacity: parseInt(newTableCapacity),
        tableStatus: "AVAILABLE",
      });
      const newTable = {
        id: response.data.table_id,
        status: response.data.status?.toLowerCase() || "available",
        capacity: response.data.capacity,
        orders: [],
        location: response.data.location,
        qrCode: response.data.qrCode,
      };
      setTables((prevTables) => [...prevTables, newTable]);
      setNewTableId(response.data.table_id);
      setNewTableNumber("");
      setNewTableCapacity("");

      const tableUrl = `http://192.168.1.100:5173/table/${response.data.table_id}`;
      const qrApiUrl = `http://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        tableUrl,
      )}&size=200x200`;
      setQrUrl(qrApiUrl);
    } catch (err) {
      console.error("Error creating table:", err);
      setErrorMessage(
        err.response?.data?.message ||
          "Không thể tạo bàn mới. Vui lòng kiểm tra thông tin và thử lại.",
      );
    }
  };

  const handleGenerateQr = async () => {
    if (!newTableId) {
      setQrError("Không tìm thấy mã bàn để tạo mã QR!");
      return;
    }
    setQrError(null);
    setQrUploading(true);
    try {
      const tableUrl = `http://192.168.1.100:5173/table/${newTableId}`;
      const qrApiUrl = `http://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        tableUrl,
      )}&size=200x200`;

      const response = await fetch(qrApiUrl);
      if (!response.ok) throw new Error("Không tải được mã QR!");
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob, `table_${newTableId}_qr.png`);
      formData.append("tableNumber", newTableId.toString());

      const res = await axios.post(`${BACKEND_URL}/api/qr/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status >= 200 && res.status < 300) {
        alert("Lưu mã QR thành công!");
        setIsAddTableModalOpen(false);
        setNewTableId(null);
        setQrUrl("");
        fetchTables();
        fetchAllNotifications();
      } else {
        throw new Error("Lỗi khi lưu mã QR!");
      }
    } catch (err) {
      console.error("Error generating QR code:", err);
      setQrError("Không thể lưu mã QR. Vui lòng thử lại!");
    } finally {
      setQrUploading(false);
    }
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `table_${newTableId}_qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading QR code:", err);
      setQrError("Không thể tải mã QR. Vui lòng thử lại!");
    }
  };

  const handlePrintQr = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <body onload="window.print()">
          <img src="${qrUrl}" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Update Table
  const handleSaveTableChanges = async () => {
    setErrorMessage("");
    const tableIds = editTableData.map((table) => table.id);
    const hasDuplicateIds = new Set(tableIds).size !== tableIds.length;
    const hasInvalidValues = editTableData.some(
      (table) => table.id <= 0 || table.capacity <= 0,
    );

    if (hasDuplicateIds) {
      setErrorMessage("Số bàn bị trùng lặp.");
      return;
    }
    if (hasInvalidValues) {
      setErrorMessage("Số bàn và sức chứa phải lớn hơn 0.");
      return;
    }

    try {
      for (const table of editTableData) {
        const originalTable = tables.find((t) => t.id === table.id);
        if (JSON.stringify(originalTable) !== JSON.stringify(table)) {
          await API.put(`/api/admin/tables/${table.id}`, {
            capacity: table.capacity,
            nextReservationTime: table.nextReservationTime || null,
            status: table.status.toUpperCase(),
            location: table.location,
            qrCode: table.qrCode,
          });
        }
      }
      setTables(editTableData);
      setIsEditTableModalOpen(false);
      fetchAllNotifications();
    } catch (err) {
      console.error("Error updating tables:", err);
      setErrorMessage("Không thể cập nhật thông tin bàn. Vui lòng thử lại.");
    }
  };

  // Delete Table
  const handleDeleteTable = async (id) => {
    try {
      await API.delete(`/api/admin/tables/${id}`);
      setTables((prevTables) => prevTables.filter((table) => table.id !== id));
      setEditTableData((prevData) =>
        prevData.filter((table) => table.id !== id),
      );
      fetchAllNotifications();
    } catch (err) {
      console.error("Error deleting table:", err);
      setErrorMessage("Không thể xóa bàn. Vui lòng thử lại.");
    }
  };

  // Orders by Table
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

  // Update Table Status
  useEffect(() => {
    if (orders.length === 0 || tables.length === 0) return;

    const now = Date.now();
    if (lastWebSocketUpdate && now - lastWebSocketUpdate < 1000) {
      console.log("Skipping useEffect sync due to recent WebSocket update");
      return;
    }

    const updatedTables = tables.map((table) => {
      const tableId = table.id.toString();
      const tableOrders = ordersByTable[tableId] || [];
      const hasUnpaidOrders = tableOrders.some(
        (order) => order.paymentStatus?.toUpperCase() !== "PAID",
      );
      const updatedStatus =
        tableOrders.length === 0 || !hasUnpaidOrders ? "available" : "occupied";

      if (
        updatedStatus !== table.status ||
        JSON.stringify(table.orders) !== JSON.stringify(tableOrders)
      ) {
        console.log(
          `Syncing table ${tableId} via useEffect: status=${updatedStatus}, orders=`,
          tableOrders,
        );
        return { ...table, status: updatedStatus, orders: tableOrders };
      }
      return table;
    });

    if (JSON.stringify(updatedTables) !== JSON.stringify(tables)) {
      console.log("Updating tables state via useEffect sync:", updatedTables);
      setTables(updatedTables);
    }
  }, [ordersByTable, tables, lastWebSocketUpdate]);

  // Unread Notifications by Table
  const unreadNotificationsByTable = useMemo(() => {
    if (
      !tables ||
      !Array.isArray(tables) ||
      !tableNotifications ||
      !Array.isArray(tableNotifications)
    ) {
      console.warn("Invalid tables or tableNotifications data");
      return {};
    }

    return tables.reduce((acc, table) => {
      if (!table || !table.id) {
        console.warn("Skipping invalid table:", table);
        return acc;
      }

      acc[table.id] = tableNotifications.filter(
        (n) => n?.tableNumber?.toString() === table.id.toString() && !n.isRead,
      ).length;
      return acc;
    }, {});
  }, [tableNotifications, tables]);

  // Print Bill & Download PDF
  const handlePrintBill = async (orderId) => {
    if (!orderId) {
      setOrderError("Mã đơn hàng không hợp lệ");
      return;
    }
    try {
      setOrderError(null);
      const response = await fetch(
        `${BACKEND_URL}/api/receipts/generate/${orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/pdf",
            ...authHeaders(),
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Không thể xuất hóa đơn PDF (Mã: ${response.status})`,
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt-order-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Đợi hoàn tất download rồi mới dọn dẹp URL Blob để tránh trình duyệt hủy download
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setOrderError(
        `Không thể tạo hóa đơn cho đơn #${orderId}: ${error.message}`,
      );
    }
  };

  const handleConfirmPrint = () => {
    const tableOrders =
      selectedTable?.orders ||
      (selectedTable ? ordersByTable[selectedTable.id.toString()] : []) ||
      [];
    if (tableOrders.length > 0) {
      const orderId = tableOrders[0].orderId;
      if (orderId) {
        handlePrintBill(orderId);
      }
    }
    setIsPrintModalOpen(false);
  };

  // Modal & Table Action Handlers
  const toggleNotificationModal = async (e, table) => {
    e.stopPropagation();
    setSelectedTable(table);
    setIsNotificationModalOpen(true);
    await fetchTableNotifications(table.id);
  };

  const handleOpenDishModal = async (e, table) => {
    e.stopPropagation();
    setSelectedTable(table);
    setIsDishModalOpen(true);
    await fetchOrders();
  };

  const handleOpenPaymentModal = async (e, table) => {
    e.stopPropagation();
    setSelectedTable(table);
    setIsPaymentModalOpen(true);
    await fetchUnpaidOrdersByTable(table.id);
  };

  const handleConfirmPayment = async () => {
    if (!selectedTable) return;
    try {
      setLoading(true);
      const tableOrders =
        selectedTable.orders ||
        ordersByTable[selectedTable.id.toString()] ||
        [];
      const unpaidOrders = tableOrders.filter(
        (o) => o.paymentStatus?.toUpperCase() !== "PAID",
      );

      // 1. Cập nhật trạng thái thanh toán cho các đơn hàng chưa thanh toán
      for (const order of unpaidOrders) {
        try {
          await API.post(`/api/payment/payment/cash/${order.orderId}`);
        } catch (e) {
          console.warn("Lỗi cập nhật thanh toán đơn:", order.orderId, e);
        }
      }

      // 2. Chuyển trạng thái bàn sang AVAILABLE
      await API.put(`/api/admin/tables/${selectedTable.id}`, {
        capacity: selectedTable.capacity,
        status: "AVAILABLE",
        location: selectedTable.location,
        qrCode: selectedTable.qrCode,
      });

      // 3. Tự động tải hóa đơn PDF của các đơn vừa thanh toán
      for (const order of unpaidOrders) {
        handlePrintBill(order.orderId);
      }

      setIsPaymentModalOpen(false);
      setActionSuccessText(
        `Đã xác nhận thanh toán và lưu hóa đơn cho Bàn ${selectedTable.id}.`,
      );
      setIsSuccessModalOpen(true);
      await fetchTables();
      await fetchOrders();
    } catch (err) {
      console.error("Error confirming payment:", err);
      setOrderError("Không thể xác nhận thanh toán. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEmptyTable = async () => {
    if (!selectedTable) return;
    try {
      setLoading(true);
      await API.put(`/api/admin/tables/${selectedTable.id}`, {
        capacity: selectedTable.capacity,
        status: "AVAILABLE",
        location: selectedTable.location,
        qrCode: selectedTable.qrCode,
      });
      setIsEmptyTableModalOpen(false);
      setActionSuccessText(
        `Đã cập nhật Bàn ${selectedTable.id} sang trạng thái sẵn sàng.`,
      );
      setIsSuccessModalOpen(true);
      await fetchTables();
    } catch (err) {
      console.error("Error updating table status:", err);
      setError("Không thể cập nhật trạng thái bàn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!transferSourceTable || !transferDestinationTable) return;
    try {
      setLoading(true);
      await API.put(`/api/admin/tables/${transferDestinationTable.id}`, {
        capacity: transferDestinationTable.capacity,
        status: "OCCUPIED",
        location: transferDestinationTable.location,
        qrCode: transferDestinationTable.qrCode,
      });
      await API.put(`/api/admin/tables/${transferSourceTable.id}`, {
        capacity: transferSourceTable.capacity,
        status: "AVAILABLE",
        location: transferSourceTable.location,
        qrCode: transferSourceTable.qrCode,
      });
      setIsTransferConfirmModalOpen(false);
      setIsTransferTableModalOpen(false);
      setIsTransferSuccessModalOpen(true);
      await fetchTables();
    } catch (err) {
      console.error("Error transferring table:", err);
      setError("Không thể chuyển bàn. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Thống kê & lọc bàn (không còn phần khu vực bàn)
  const stats = useMemo(() => {
    const total = tables.length;
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const available = tables.filter((t) => t.status !== "occupied").length;
    const unpaidCount = orders.filter(
      (o) => o.paymentStatus?.toUpperCase() === "UNPAID",
    ).length;
    const paidCount = orders.filter(
      (o) => o.paymentStatus?.toUpperCase() === "PAID",
    ).length;

    return {
      total,
      occupied,
      available,
      paidCount,
      unpaidCount,
    };
  }, [tables, orders]);

  const filteredTables = useMemo(() => {
    return tables.filter((table) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "occupied" && table.status === "occupied") ||
        (statusFilter === "available" && table.status !== "occupied");

      const query = searchQuery.trim().toLowerCase();
      const customerNames = (table.orders || [])
        .map((o) => o.customerName || "")
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !query ||
        String(table.id).toLowerCase().includes(query) ||
        `bàn ${table.id}`.includes(query) ||
        customerNames.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [tables, statusFilter, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTables.length / tablesPerPage),
  );
  const paginatedTables = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * tablesPerPage;
    return filteredTables.slice(start, start + tablesPerPage);
  }, [filteredTables, currentPage, totalPages]);

  const availableTablesList = useMemo(
    () => tables.filter((t) => t.status !== "occupied"),
    [tables],
  );

  const fontStyle = {
    fontFamily:
      "'Be Vietnam Pro', 'Lexend', system-ui, -apple-system, sans-serif",
  };
  const headingFontStyle = {
    fontFamily: "'Lexend', 'Be Vietnam Pro', system-ui, sans-serif",
  };

  const navItems = [
    { label: "Quản lý bàn", path: "/table-management_admin" },
    { label: "Chấm công", path: "/attendance" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FAF7F2] flex flex-col text-[#33261D] font-sans">
      {/* Thanh mục lục chuẩn hóa: Tiếng Việt, tone sáng vàng nhạt - cam nhạt - trắng */}
      <MenuBar title="Quản lý sơ đồ bàn" />

      {/* Cảnh báo lỗi nếu có: nổi phía trên nội dung để không đẩy layout khi xuất hiện muộn */}
      {(authError || error || orderError || socketError) && (
        <div role="alert" className="fixed top-[72px] inset-x-0 z-30 px-4 sm:px-6 space-y-1.5 pointer-events-none [&>*]:pointer-events-auto [&>*]:shadow-md max-w-3xl mx-auto">
          {authError && (
            <div className="bg-[#FFF2EC] border border-[#F6C8B4] text-[#A63A14] px-4 py-2 rounded-lg text-xs font-medium">
              {authError}
            </div>
          )}
          {error && (
            <div className="bg-[#FFF2EC] border border-[#F6C8B4] text-[#A63A14] px-4 py-2 rounded-lg text-xs font-medium flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchTables}
                className="underline font-semibold ml-3"
              >
                Thử lại
              </button>
            </div>
          )}
          {orderError && (
            <div className="bg-[#FFF8E6] border border-[#F3D89E] text-[#8E5B0E] px-4 py-2 rounded-lg text-xs font-medium">
              {orderError}
            </div>
          )}
          {socketError && (
            <div className="bg-[#FFFDF7] border border-[#EFE3CA] text-[#7D6E5C] px-3.5 py-1.5 rounded-lg text-[11px]">
              {socketError}
            </div>
          )}
        </div>
      )}

      {/* Vùng nội dung chính full màn hình */}
      <main className="flex-1 min-h-0 px-4 sm:px-6 py-4 flex flex-col gap-4 overflow-hidden">
        {/* Thanh thống kê + lọc trạng thái + tìm kiếm bàn (bỏ phần khu vực bàn) */}
        <div className="shrink-0 bg-white border border-[#F2DFC2] rounded-2xl px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: `Tất cả (${stats.total})` },
              { id: "occupied", label: `Đang phục vụ (${stats.occupied})` },
              { id: "available", label: `Bàn trống (${stats.available})` },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    active
                      ? "bg-[#FFEAD2] text-[#A84B14] border border-[#F6C89B]"
                      : "bg-[#FFFDF8] text-[#6E6050] hover:bg-[#FFF7E6] border border-[#F3E6CE]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#6E6050]">
            <span>
              Tổng bàn:{" "}
              <strong className="text-[#3A2E22] font-semibold">
                {stats.total}
              </strong>
            </span>
            <span className="text-[#EBD8B8]">•</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E06D2B]" />
              Đang phục vụ:{" "}
              <strong className="text-[#C75619] font-semibold">
                {stats.occupied}
              </strong>
            </span>
            <span className="text-[#EBD8B8]">•</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D99B26]" />
              Bàn trống:{" "}
              <strong className="text-[#9E6B0B] font-semibold">
                {stats.available}
              </strong>
            </span>
          </div>

          <div className="relative w-full lg:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89378] pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm số bàn, tên khách..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#F0DEC0] bg-[#FFFDF8] text-xs text-[#3A2E22] placeholder-[#A89882] focus:outline-none focus:border-[#E08A3C]"
            />
          </div>
        </div>

        {/* Lưới nội dung chính: danh sách bàn bên trái + chú thích & thao tác bên phải */}
        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Danh sách thẻ bàn */}
          <div className="xl:col-span-8 flex flex-col min-h-0 overflow-y-auto pr-1">
            {loading && tables.length === 0 ? (
              <div className="bg-white border border-[#F2DFC2] rounded-2xl p-12 text-center text-sm text-[#7D6E5C]">
                Đang tải danh sách bàn...
              </div>
            ) : paginatedTables.length === 0 ? (
              <div className="bg-white border border-[#F2DFC2] rounded-2xl p-12 text-center text-sm text-[#7D6E5C]">
                Không tìm thấy bàn nào phù hợp.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {paginatedTables.map((table) => {
                  const tableOrders =
                    table.orders || ordersByTable[table.id.toString()] || [];
                  const unpaidOrders = tableOrders.filter(
                    (o) => o.paymentStatus?.toUpperCase() === "UNPAID",
                  );
                  const isOccupied =
                    table.status === "occupied" || unpaidOrders.length > 0;

                  const totalItemsCount = unpaidOrders.reduce((sum, order) => {
                    const itemsSum = (order.items || []).reduce(
                      (iSum, item) => iSum + (Number(item.quantity) || 1),
                      0,
                    );
                    return sum + (itemsSum > 0 ? itemsSum : 1);
                  }, 0);

                  const totalUnpaidAmount = unpaidOrders.reduce(
                    (sum, order) => sum + (Number(order.totalAmount) || 0),
                    0,
                  );

                  const unreadCount = unreadNotificationsByTable[table.id] || 0;
                  const hasAlert = unreadCount >= 3;
                  const formattedTableNum = String(table.id).padStart(2, "0");

                  return (
                    <div
                      key={table.id}
                      onClick={() => setSelectedTable(table)}
                      className={`rounded-2xl overflow-hidden bg-white transition-all cursor-pointer flex flex-col justify-between ${
                        hasAlert
                          ? "border border-[#F3B594] bg-[#FFFBF8]"
                          : "border border-[#F2DFC2] hover:border-[#E5BD7A]"
                      }`}
                    >
                      {/* Header thẻ bàn phân tách rõ trạng thái Có khách / Sẵn sàng */}
                      <div
                        className={`px-4 py-2.5 flex items-center justify-between border-b transition-colors duration-200 ${
                          isOccupied
                            ? "bg-gradient-to-r from-[#EA580C] to-[#C2410C] border-[#9A3412]"
                            : "bg-[#ECFDF5] border-[#A7F3D0]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-base font-bold ${
                              isOccupied ? "text-white" : "text-[#065F46]"
                            }`}
                            style={headingFontStyle}
                          >
                            Bàn {formattedTableNum}
                          </span>
                          {isOccupied ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-[#C2410C] shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
                              Có khách
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D1FAE5] text-[#047857] border border-[#6EE7B7]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                              Sẵn sàng
                            </span>
                          )}
                        </div>

                        <div
                          className={`flex items-center gap-1 text-xs font-semibold ${
                            isOccupied ? "text-[#FFEDD5]" : "text-[#047857]"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-3.5 w-3.5 ${
                              isOccupied ? "text-[#FED7AA]" : "text-[#10B981]"
                            }`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                          <span>{table.capacity || 4} chỗ</span>
                          {table.nextReservationTime && (
                            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EDE9FE] text-[#5B21B6] border border-[#C4B5FD]">
                              Hẹn {table.nextReservationTime}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Thân thẻ bàn */}
                      <div className="grid grid-cols-2 divide-x divide-[#F5E8D0] px-4 py-3">
                        <div className="pr-3">
                          <p className="text-[10px] font-semibold tracking-wider text-[#9A8568] uppercase mb-1">
                            TRẠNG THÁI BÀN
                          </p>
                          <p className="text-xs font-medium text-[#4A3B2C]">
                            {isOccupied ? "Đang dùng bữa" : "Chưa có khách"}
                          </p>
                        </div>

                        <div
                          onClick={(e) => handleOpenDishModal(e, table)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleOpenDishModal(e, table);
                            }
                          }}
                          className="pl-4 py-1 pr-2 rounded-lg cursor-pointer hover:bg-[#FFF7E6]/80 transition-colors group"
                          title="Nhấn để xem danh sách món"
                        >
                          <p className="text-[10px] font-semibold tracking-wider text-[#9A8568] group-hover:text-[#C85319] uppercase mb-1 transition-colors">
                            MÓN CHƯA TRẢ TIỀN
                          </p>
                          {isOccupied ? (
                            <>
                              <p className="text-sm font-bold text-[#C85319] underline-offset-2 group-hover:underline">
                                {totalItemsCount > 0
                                  ? `${totalItemsCount} món`
                                  : `${unpaidOrders.length} đơn`}
                              </p>
                              <p className="text-[11px] text-[#7D6B55] mt-0.5">
                                {formatVND(totalUnpaidAmount)}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold text-[#8A775E] mt-0.5">
                              0 món
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer thao tác trên từng bàn */}
                      <div className="border-t border-[#F5E8D0] px-4 py-2 flex items-center justify-between gap-2 bg-[#FFFDF8]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => toggleNotificationModal(e, table)}
                            className="relative w-7 h-7 rounded-full border border-[#EED8B4] bg-white hover:bg-[#FFF5E2] text-[#8A5A1C] flex items-center justify-center transition-colors"
                            title="Thông báo từ bàn"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {unreadCount > 0 && (
                              <span className="-top-1 -right-1 absolute min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white bg-[#E06324] flex items-center justify-center">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOccupied ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => handleOpenDishModal(e, table)}
                                className="px-3 py-1 rounded-lg border border-[#EBD4B0] bg-white hover:bg-[#FFF7E6] text-xs font-medium text-[#4A3B2C] transition-colors"
                              >
                                Xem món
                              </button>
                              <button
                                type="button"
                                onClick={(e) =>
                                  handleOpenPaymentModal(e, table)
                                }
                                className="px-3 py-1 rounded-lg bg-[#FCE3C8] hover:bg-[#FAD3AC] text-[#A64410] border border-[#F3B982] text-xs font-semibold transition-colors"
                              >
                                Thanh toán
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTable(table);
                                setIsEmptyTableModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg bg-[#FFF2CC] hover:bg-[#FFE6A3] text-[#855509] border border-[#EBCB7B] text-xs font-semibold transition-colors"
                            ></button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="mt-3 pt-2 flex items-center justify-between text-xs text-[#6E6050]">
                <span>
                  Trang {currentPage} / {totalPages} ({filteredTables.length}{" "}
                  bàn)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-[#EED8B4] bg-white disabled:opacity-40 hover:bg-[#FFF7E6]"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="px-3 py-1 rounded-lg border border-[#EED8B4] bg-white disabled:opacity-40 hover:bg-[#FFF7E6]"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cột bên phải: Chú thích trạng thái & Thao tác hệ thống (bỏ phần mô tả vị trí ngồi) */}
          <aside className="xl:col-span-4 flex flex-col gap-4 overflow-y-auto">
            {/* Chú thích trạng thái */}
            <div className="bg-white border border-[#F2DFC2] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="text-xs font-bold tracking-wider text-[#6E4B18] uppercase"
                  style={headingFontStyle}
                >
                  Chú thích trạng thái
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FFF7E4] text-[#9A6814]">
                  Cập nhật
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 text-[#4A3B2C]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span>Bàn trống / Sẵn sàng</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[#D1FAE5] text-[#047857] border border-[#6EE7B7] font-bold text-[11px]">
                    {stats.available} bàn
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 text-[#4A3B2C]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] animate-pulse" />
                    <span>Đang phục vụ</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white font-bold text-[11px] shadow-2xs">
                    {stats.occupied} bàn
                  </span>
                </div>
              </div>
            </div>

            {/* Thao tác hệ thống */}
            <div className="bg-white border border-[#F2DFC2] rounded-2xl p-4">
              <h2
                className="text-xs font-bold tracking-wider text-[#6E4B18] uppercase mb-3"
                style={headingFontStyle}
              >
                Thao tác hệ thống
              </h2>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setQrError(null);
                    setNewTableId(null);
                    setQrUrl("");
                    setIsAddTableModalOpen(true);
                  }}
                  className="!py-3 !px-2 !rounded-xl border border-[#F0DEC0] bg-[#FFFDF9] hover:bg-[#FFF6E5] flex flex-col items-center justify-center !gap-2 text-[11px] font-semibold text-[#4A3B2C] transition-colors cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#B8581E]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 5v14m-7-7h14"
                    />
                  </svg>
                  <span>Thêm bàn</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setEditTableData(tables.map((t) => ({ ...t })));
                    setIsEditTableModalOpen(true);
                  }}
                  className="!py-3 !px-2 !rounded-xl border border-[#F0DEC0] bg-[#FFFDF9] hover:bg-[#FFF6E5] flex flex-col items-center justify-center !gap-2 text-[11px] font-semibold text-[#4A3B2C] transition-colors cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#B8581E]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  <span>Sửa bàn</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fetchTables();
                    fetchAllNotifications();
                  }}
                  className="!py-3 !px-2 !rounded-xl border border-[#F0DEC0] bg-[#FFFDF9] hover:bg-[#FFF6E5] flex flex-col items-center justify-center !gap-2 text-[11px] font-semibold text-[#4A3B2C] transition-colors cursor-pointer group"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#B8581E] transition-transform duration-300 group-hover:rotate-180"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 16h5v5" />
                  </svg>
                  <span>Chuyển bàn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualOrderModalOpen(true)}
                  className="!py-3 !px-2 !rounded-xl border border-[#F0DEC0] bg-[#FFFDF9] hover:bg-[#FFF6E5] flex flex-col items-center justify-center !gap-2 text-[11px] font-semibold text-[#4A3B2C] transition-colors cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#B8581E]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3h2l2.4 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6"
                    />
                    <circle cx="10" cy="21" r="1" />
                    <circle cx="19" cy="21" r="1" />
                    <path strokeLinecap="round" d="M12 6v6m-3-3h6" />
                  </svg>
                  <span>Đặt món thủ công</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReservationModalOpen(true)}
                  className="!py-3 !px-2 !rounded-xl border border-[#F0DEC0] bg-[#FFFDF9] hover:bg-[#FFF6E5] flex flex-col items-center justify-center !gap-2 text-[11px] font-semibold text-[#4A3B2C] transition-colors cursor-pointer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-[18px] h-[18px] text-[#B8581E]"
                  >
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 10h18" />
                    <path d="M12 14v5M9.5 16.5h5" />
                  </svg>
                  <span>
                    Lịch hẹn
                    {pendingReservationCount > 0 && (
                      <span className="ml-1 rounded-full bg-[#B73512] px-1.5 py-0.5 text-[10px] text-white">
                        {pendingReservationCount}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </aside>
          <ManualOrderModal
            isOpen={isManualOrderModalOpen}
            onClose={() => setIsManualOrderModalOpen(false)}
            tables={tables.map((t) => ({ tableNumber: t.id, capacity: t.capacity, status: t.status }))}
            defaultTableNumber={selectedTable?.id}
            onOrderSuccess={() => {
              fetchTables();
              fetchOrders();
            }}
          />
          <ReservationManager
            isOpen={isReservationModalOpen}
            onClose={() => {
              setIsReservationModalOpen(false);
              setReservationRefreshKey((k) => k + 1);
            }}
            tables={tables.map((t) => ({ tableNumber: t.id, capacity: t.capacity }))}
            onChanged={() => {
              fetchTables();
              fetchOrders();
            }}
          />
        </div>
      </main>

      {isDishModalOpen &&
        selectedTable &&
        (() => {
          const unpaidOrders = (
            ordersByTable[selectedTable.id.toString()] || []
          ).filter((order) => order.paymentStatus?.toUpperCase() !== "PAID");

          // Helper hiển thị badge trạng thái món
          const renderDishStatusBadge = (status) => {
            const s = (status || "").toString().toUpperCase().trim();
            if (
              [
                "COMPLETED",
                "DONE",
                "SERVED",
                "HOAN_THANH",
                "HOÀN THÀNH",
              ].includes(s)
            ) {
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#D1FAE5] text-[#047857] border border-[#6EE7B7]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  Hoàn thành
                </span>
              );
            }
            if (
              [
                "COOKING",
                "PREPARING",
                "IN_PROGRESS",
                "DANG_LAM",
                "ĐANG LÀM",
              ].includes(s)
            ) {
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                  Đang làm
                </span>
              );
            }
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFEDD5] text-[#C2410C] border border-[#FDBA74]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                Chưa làm
              </span>
            );
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/40 backdrop-blur-2xs px-4">
              <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-2xl w-full max-w-4xl p-6 flex flex-col max-h-[85vh]">
                {/* Header Modal */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F5E8D0]">
                  <div className="flex items-center gap-3">
                    <h3
                      className="text-lg font-bold text-[#3A2E22]"
                      style={headingFontStyle}
                    >
                      Chi tiết món chưa thanh toán — Bàn{" "}
                      {String(selectedTable.id).padStart(2, "0")}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFEDD5] text-[#C2410C]">
                      {unpaidOrders.length} đơn chưa thanh toán
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDishModalOpen(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[#8A775E] hover:text-[#3A2E22] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Thông báo lỗi nếu có */}
                {orderError && (
                  <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {orderError}
                  </p>
                )}

                {/* Danh sách các đơn chưa thanh toán */}
                {orderLoading ? (
                  <p className="text-sm text-[#7D6B55] py-10 text-center">
                    Đang tải danh sách món...
                  </p>
                ) : unpaidOrders.length === 0 ? (
                  <div className="py-12 text-center bg-[#FFFDF8] rounded-xl border border-dashed border-[#EBD4B0]">
                    <p className="text-sm font-medium text-[#7D6B55]">
                      Bàn hiện không có đơn gọi món nào chưa thanh toán.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                    {unpaidOrders.map((order) => {
                      const activeItems = (order.items || []).filter(
                        (it) =>
                          (it.status || "").toString().toUpperCase() !==
                          "CANCELLED",
                      );
                      if (activeItems.length === 0) return null;

                      return (
                        <div
                          key={order.orderId}
                          className="border border-[#F2DFC2] rounded-2xl overflow-hidden shadow-2xs bg-white"
                        >
                          {/* Thanh thông tin đơn + Nút Thanh toán và In bill kế bên Order */}
                          <div className="bg-[#FAF4EA] px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#EBD4B0]">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 rounded-xl bg-[#FFE4CC] text-[#C2410C] font-extrabold text-sm border border-[#FDBA74]">
                                Đơn #{order.orderId}
                              </span>
                              {order.customerName && (
                                <span className="text-xs font-semibold text-[#4A3B2C]">
                                  Khách:{" "}
                                  <strong className="text-[#3A2E22]">
                                    {order.customerName}
                                  </strong>
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                                Chưa thanh toán
                              </span>
                            </div>

                            {/* Cụm nút thao tác kế bên Order: In bill & Thanh toán rộng rãi, cách viền đàng hoàng */}
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => handlePrintBill(order.orderId)}
                                className="inline-flex items-center gap-2 px-4.5 py-2 rounded-xl border border-[#EBD4B0] bg-white hover:bg-[#FFF9F2] text-[#5C4A3C] hover:text-[#C2410C] text-xs font-semibold tracking-wide transition-all shadow-2xs cursor-pointer"
                                title="Tải hóa đơn PDF của đơn này"
                              >
                                <svg
                                  className="w-4 h-4 text-[#C2410C]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                  />
                                </svg>
                                <span>In hóa đơn</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handlePrintBill(order.orderId);
                                  setIsDishModalOpen(false);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:opacity-95 text-white text-xs font-bold shadow-xs cursor-pointer transition-all duration-150 hover:scale-102 active:scale-98 tracking-wide"
                                title="Thanh toán và in hóa đơn cho bàn này"
                              >
                                <div className="inline-flex px-1 py-1">
                                  <svg
                                    className="py-1 px-1 w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                  </svg>
                                  <span>Thanh toán & In bill</span>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Bảng chi tiết các món của đơn hàng */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead className="bg-[#FFFDF8] text-[#6E5A47] uppercase text-[10px] font-bold border-b border-[#F5E8D0]">
                                <tr>
                                  <th className="py-2.5 px-3.5">Tên món</th>
                                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                    Số lượng
                                  </th>
                                  <th className="py-2.5 px-3.5">
                                    Ghi chú (Note)
                                  </th>
                                  <th className="py-2.5 px-3.5 whitespace-nowrap">
                                    Trạng thái
                                  </th>
                                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                    Đơn giá
                                  </th>
                                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">
                                    Thành tiền
                                  </th>
                                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                    Thao tác
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#F5E8D0]">
                                {activeItems.map((item, idx) => {
                                  const canEdit = isDishPending(
                                    item.status ||
                                      item.itemStatus ||
                                      item.cookingStatus,
                                  );
                                  const qty = Number(item.quantity) || 1;
                                  const unitPrice = Number(item.price) || 0;

                                  return (
                                    <tr
                                      key={`${order.orderId}-${item.dishId || item.id || idx}`}
                                      className="hover:bg-[#FFFDF8] transition-colors"
                                    >
                                      {/* Tên món */}
                                      <td className="py-2.5 px-3.5 font-semibold text-[#3A2E22]">
                                        {item.dishName}
                                      </td>

                                      {/* Số lượng: Nếu chưa làm thì có nút chỉnh số lượng, nếu đang làm/hoàn thành thì khóa */}
                                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                        {canEdit ? (
                                          <div className="inline-flex items-center gap-1.5 bg-[#FAF7F2] border border-[#EBD4B0] rounded-lg px-1.5 py-1">
                                            <button
                                              type="button"
                                              disabled={qty <= 1}
                                              onClick={() =>
                                                handleUpdateDishQuantity(
                                                  order.orderId,
                                                  item.dishId,
                                                  item,
                                                  qty - 1,
                                                )
                                              }
                                              className="w-5 h-5 rounded bg-white border border-[#E5D3B3] text-[#4A3B2C] font-bold hover:bg-[#EA580C] hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#4A3B2C] transition-colors cursor-pointer"
                                              title="Giảm số lượng"
                                            >
                                              -
                                            </button>
                                            <span className="min-w-5 text-center font-bold text-[#3A2E22]">
                                              {qty}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleUpdateDishQuantity(
                                                  order.orderId,
                                                  item.dishId,
                                                  item,
                                                  qty + 1,
                                                )
                                              }
                                              className="w-5 h-5 rounded bg-white border border-[#E5D3B3] text-[#4A3B2C] font-bold hover:bg-[#EA580C] hover:text-white transition-colors cursor-pointer"
                                              title="Tăng số lượng"
                                            >
                                              +
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="font-bold text-[#3A2E22] px-2.5 py-1 rounded-md bg-[#F7F3EC] border border-[#EFE5D7]">
                                            × {qty}
                                          </span>
                                        )}
                                      </td>

                                      {/* Ghi chú */}
                                      <td className="py-2.5 px-3.5 text-[#6E6050] max-w-[180px]">
                                        {item.notes ? (
                                          <span className="italic text-[#7D6B55]">
                                            {item.notes}
                                          </span>
                                        ) : (
                                          <span className="text-[#B8A996]">
                                            —
                                          </span>
                                        )}
                                      </td>

                                      {/* Trạng thái thực hiện */}
                                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                                        {renderDishStatusBadge(
                                          item.status ||
                                            item.itemStatus ||
                                            item.cookingStatus,
                                        )}
                                      </td>

                                      {/* Đơn giá */}
                                      <td className="py-2.5 px-3.5 text-right text-[#6E6050] whitespace-nowrap">
                                        {formatVND(unitPrice)}
                                      </td>

                                      {/* Thành tiền */}
                                      <td className="py-2.5 px-3.5 text-right font-bold text-[#3A2E22] whitespace-nowrap">
                                        {formatVND(unitPrice * qty)}
                                      </td>

                                      {/* Thao tác: Chỉ có nút Hủy khi chưa làm, đang làm/hoàn thành không có nút xóa */}
                                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                        {canEdit ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleCancelDishItem(
                                                order.orderId,
                                                item.dishId,
                                                item,
                                              )
                                            }
                                            className="px-2.5 py-1 rounded-lg bg-[#FEF2F2] hover:bg-[#DC2626] text-[#DC2626] hover:text-white border border-[#FECACA] text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                                          >
                                            Hủy món
                                          </button>
                                        ) : (
                                          <span className="text-[11px] font-medium text-[#9C8A79] bg-[#FAF6F0] px-2 py-0.5 rounded border border-[#EDE0D2]">
                                            Đã khóa
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer Modal */}
                <div className="mt-4 pt-3 border-t border-[#F5E8D0] flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#6E6050]">
                    Tổng tạm tính bàn:{" "}
                    <span className="text-sm font-bold text-[#C85319] ml-1">
                      {formatVND(
                        unpaidOrders.reduce(
                          (sum, o) => sum + (Number(o.totalAmount) || 0),
                          0,
                        ),
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsDishModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-[#EBD4B0] bg-white text-xs font-semibold text-[#5C4A3C] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Modal Thanh toán */}
      {isPaymentModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/30 backdrop-blur-2xs px-4">
          <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3
              className="text-lg font-semibold text-[#3A2E22] mb-2"
              style={headingFontStyle}
            >
              Xác nhận thanh toán — Bàn{" "}
              {String(selectedTable.id).padStart(2, "0")}
            </h3>
            <p className="text-xs text-[#7D6B55] mb-4">
              Kiểm tra các đơn chưa thanh toán trước khi giải phóng bàn.
            </p>
            {orderError && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {orderError}
              </p>
            )}
            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto text-xs">
              {(ordersByTable[selectedTable.id.toString()] || [])
                .filter((o) => o.paymentStatus?.toUpperCase() !== "PAID")
                .map((order) => (
                  <div
                    key={order.orderId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFFDF8] border border-[#F5E8D0]"
                  >
                    <span>Đơn #{order.orderId}</span>
                    <span className="font-semibold text-[#C85319]">
                      {formatVND(order.totalAmount)}
                    </span>
                  </div>
                ))}
            </div>
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[#EED8B4] bg-white text-xs font-semibold text-[#5C4A3C] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const tableOrders =
                    selectedTable.orders ||
                    ordersByTable[selectedTable.id.toString()] ||
                    [];
                  const unpaid = tableOrders.filter(
                    (o) => o.paymentStatus?.toUpperCase() !== "PAID",
                  );
                  if (unpaid.length > 0) {
                    unpaid.forEach((o) => handlePrintBill(o.orderId));
                  } else if (tableOrders.length > 0) {
                    handlePrintBill(tableOrders[0].orderId);
                  }
                }}
                className="px-5 py-2.5 rounded-xl border border-[#EBD4B0] bg-white hover:bg-[#FFF9F2] text-[#5C4A3C] hover:text-[#C2410C] text-xs font-bold shadow-2xs cursor-pointer transition-all tracking-wide inline-flex items-center gap-2"
                title="Tải hóa đơn PDF của bàn này"
              >
                <svg
                  className="w-4 h-4 text-[#C2410C]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>In hóa đơn</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmPayment}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:opacity-95 text-white border border-[#C2410C] text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60 shadow-xs cursor-pointer tracking-wide inline-flex items-center gap-2"
              >
                <div className="inline-flex px-1 py-1">
                  <svg
                    className="py-1 px-1 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>Xác nhận thanh toán</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mở bàn / Làm trống bàn */}
      {isEmptyTableModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/30 backdrop-blur-2xs px-4">
          <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3
              className="text-lg font-semibold text-[#3A2E22] mb-2"
              style={headingFontStyle}
            >
              Mở bàn {String(selectedTable.id).padStart(2, "0")}?
            </h3>
            <p className="text-xs text-[#7D6B55] mb-5">
              Xác nhận kích hoạt Bàn {String(selectedTable.id).padStart(2, "0")}{" "}
              ({selectedTable.capacity || 4} chỗ).
            </p>
            <div className="flex justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsEmptyTableModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EED8B4] bg-white text-xs font-medium text-[#4A3B2C]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmEmptyTable}
                className="px-4 py-2 rounded-xl bg-[#FFF0C2] hover:bg-[#FFE499] text-[#855509] border border-[#EBCB7B] text-xs font-semibold"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hóa đơn & In bill */}
      {isBillModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/30 backdrop-blur-2xs px-4">
          <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3
              className="text-lg font-semibold text-[#3A2E22] mb-2"
              style={headingFontStyle}
            >
              Hóa đơn — Bàn {String(selectedTable.id).padStart(2, "0")}
            </h3>
            <p className="text-xs text-[#7D6B55] mb-5">
              Xuất file PDF hóa đơn cho đơn hiện tại của bàn.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBillModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EED8B4] bg-white text-xs font-medium text-[#4A3B2C]"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsBillModalOpen(false);
                  setIsPrintModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#FFF2CC] hover:bg-[#FFE6A3] text-[#855509] border border-[#EBCB7B] text-xs font-semibold"
              >
                In hóa đơn PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận in hóa đơn */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/30 backdrop-blur-2xs px-4">
          <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3
              className="text-lg font-semibold text-[#3A2E22] mb-3"
              style={headingFontStyle}
            >
              Xác nhận in hóa đơn?
            </h3>
            <div className="flex justify-center gap-3 mt-4">
              <button
                type="button"
                onClick={handleConfirmPrint}
                className="px-4 py-2 rounded-xl bg-[#FFF0C2] hover:bg-[#FFE499] text-[#855509] border border-[#EBCB7B] text-xs font-semibold"
              >
                Đồng ý
              </button>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EED8B4] bg-white text-xs font-medium text-[#4A3B2C]"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thông báo của bàn */}
      {isNotificationModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/30 backdrop-blur-2xs px-4">
          <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold text-[#3A2E22]"
                style={headingFontStyle}
              >
                Thông báo — Bàn {String(selectedTable.id).padStart(2, "0")}
              </h3>
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="text-[#8A775E] hover:text-[#3A2E22]"
              >
                ✕
              </button>
            </div>

            {notificationsError && (
              <p className="text-xs text-[#C85319] mb-3">
                {notificationsError}
              </p>
            )}

            {notificationsLoading ? (
              <p className="text-xs text-[#7D6B55] py-6 text-center">
                Đang tải thông báo...
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2.5">
                {tableNotifications.filter(
                  (n) =>
                    n.tableNumber?.toString() === selectedTable.id.toString(),
                ).length === 0 ? (
                  <p className="text-xs text-[#7D6B55] text-center py-6">
                    Không có thông báo nào cho bàn này.
                  </p>
                ) : (
                  tableNotifications
                    .filter(
                      (n) =>
                        n.tableNumber?.toString() ===
                        selectedTable.id.toString(),
                    )
                    .map((n) => (
                      <div
                        key={n.notificationId}
                        className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                          n.isRead
                            ? "bg-[#FFFDF8] border-[#F5E8D0] text-[#7D6B55]"
                            : "bg-[#FFF4EA] border-[#F7C9AD] text-[#3A2E22]"
                        }`}
                      >
                        <div>
                          <p className="font-medium">
                            {n.message || "Yêu cầu hỗ trợ từ bàn"}
                          </p>
                          <span className="text-[11px] text-[#9A8568]">
                            {n.isRead ? "Đã xử lý" : "Chưa xử lý"}
                          </span>
                        </div>
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() =>
                              markNotificationAsRead(n.notificationId)
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#FFF0C2] text-[#855509] border border-[#EBCB7B] text-[11px] font-semibold shrink-0"
                          >
                            Đã đọc
                          </button>
                        )}
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Thêm bàn & tạo mã QR */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/30 backdrop-blur-2xs px-4">
          <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold text-[#3A2E22]"
                style={headingFontStyle}
              >
                Thêm bàn mới
              </h3>
              <button
                onClick={() => setIsAddTableModalOpen(false)}
                className="text-[#8A775E] hover:text-[#3A2E22]"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-[#FFF2EC] border border-[#F6C8B4] text-xs text-[#A63A14]">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleAddTableSuccess} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#4A3B2C] mb-1">
                  Số bàn
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#F0DEC0] bg-[#FFFDF8] text-sm text-[#3A2E22]"
                  placeholder="Ví dụ: 7"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A3B2C] mb-1">
                  Sức chứa (số chỗ)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#F0DEC0] bg-[#FFFDF8] text-sm text-[#3A2E22]"
                  placeholder="Ví dụ: 4"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EED8B4] bg-white text-xs font-medium text-[#4A3B2C]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FFF0C2] hover:bg-[#FFE499] text-[#855509] border border-[#EBCB7B] text-xs font-semibold"
                >
                  Tạo bàn
                </button>
              </div>
            </form>

            {newTableId && qrUrl && (
              <div className="mt-5 pt-4 border-t border-[#F5E8D0] text-center">
                <p className="text-xs font-medium text-[#3A2E22] mb-2">
                  Mã QR cho Bàn #{newTableId}
                </p>
                <img
                  src={qrUrl}
                  alt={`QR Bàn ${newTableId}`}
                  className="w-36 h-36 mx-auto border border-[#F2DFC2] rounded-xl p-1.5 bg-white"
                />
                {qrError && (
                  <p className="text-xs text-[#C85319] mt-2">{qrError}</p>
                )}
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    disabled={qrUploading}
                    onClick={handleGenerateQr}
                    className="px-3 py-1.5 rounded-xl bg-[#FFF0C2] text-[#855509] border border-[#EBCB7B] text-xs font-semibold disabled:opacity-60"
                  >
                    {qrUploading ? "Đang lưu..." : "Lưu QR lên hệ thống"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="px-3 py-1.5 rounded-xl border border-[#EED8B4] bg-white text-xs font-medium text-[#4A3B2C]"
                  >
                    Tải QR
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintQr}
                    className="px-3 py-1.5 rounded-xl border border-[#EED8B4] bg-white text-xs font-medium text-[#4A3B2C]"
                  >
                    In QR
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Chỉnh sửa danh sách bàn */}
      {isEditTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/30 backdrop-blur-2xs px-4">
          <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-xl w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold text-[#3A2E22]"
                style={headingFontStyle}
              >
                Chỉnh sửa danh sách bàn
              </h3>
              <button
                onClick={() => setIsEditTableModalOpen(false)}
                className="text-[#8A775E] hover:text-[#3A2E22]"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="mb-3 p-2.5 rounded-xl bg-[#FFF2EC] border border-[#F6C8B4] text-xs text-[#A63A14]">
                {errorMessage}
              </div>
            )}

            <div className="max-h-80 overflow-y-auto space-y-2.5">
              {editTableData.map((t, index) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[#F5E8D0] bg-[#FFFDF8] text-xs"
                >
                  <span className="font-semibold text-[#3A2E22] w-20">
                    Bàn {String(t.id).padStart(2, "0")}
                  </span>
                  <label className="flex items-center gap-1.5">
                    <span className="text-[#7D6B55]">Sức chứa:</span>
                    <input
                      type="number"
                      min="1"
                      value={t.capacity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 1;
                        setEditTableData((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? { ...item, capacity: val } : item,
                          ),
                        );
                      }}
                      className="w-16 px-2 py-1 rounded-lg border border-[#F0DEC0] bg-white"
                    />
                  </label>
                  <select
                    value={t.status}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditTableData((prev) =>
                        prev.map((item, idx) =>
                          idx === index ? { ...item, status: val } : item,
                        ),
                      );
                    }}
                    className="px-2 py-1 rounded-lg border border-[#F0DEC0] bg-white"
                  >
                    <option value="available">Sẵn sàng</option>
                    <option value="occupied">Có khách</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDeleteTable(t.id)}
                    className="p-1.5 text-[#C85319] hover:bg-[#FFF2EC] rounded-lg"
                    title="Xóa bàn"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditTableModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EED8B4] bg-white text-xs font-medium text-[#4A3B2C]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveTableChanges}
                className="px-4 py-2 rounded-xl bg-[#FFF0C2] hover:bg-[#FFE499] text-[#855509] border border-[#EBCB7B] text-xs font-semibold"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chuyển bàn */}
      {isTransferTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/30 backdrop-blur-2xs px-4">
          <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3
              className="text-lg font-semibold text-[#3A2E22] mb-3"
              style={headingFontStyle}
            >
              Chuyển bàn cho khách
            </h3>
            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="block text-[#7D6B55] mb-1">Từ bàn</label>
                <select
                  value={transferSourceTable?.id || ""}
                  onChange={(e) =>
                    setTransferSourceTable(
                      tables.find((t) => String(t.id) === e.target.value) ||
                        null,
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#F0DEC0] bg-[#FFFDF8]"
                >
                  <option value="">Chọn bàn đang có khách</option>
                  {tables
                    .filter((t) => t.status === "occupied")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        Bàn {String(t.id).padStart(2, "0")}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-[#7D6B55] mb-1">
                  Sang bàn trống
                </label>
                <select
                  value={transferDestinationTable?.id || ""}
                  onChange={(e) =>
                    setTransferDestinationTable(
                      tables.find((t) => String(t.id) === e.target.value) ||
                        null,
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#F0DEC0] bg-[#FFFDF8]"
                >
                  <option value="">Chọn bàn đích</option>
                  {availableTablesList.map((t) => (
                    <option key={t.id} value={t.id}>
                      Bàn {String(t.id).padStart(2, "0")} ({t.capacity || 4}{" "}
                      chỗ)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTransferTableModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EED8B4] bg-white text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!transferSourceTable || !transferDestinationTable}
                onClick={() => setIsTransferConfirmModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#FFF0C2] text-[#855509] border border-[#EBCB7B] text-xs font-semibold disabled:opacity-50"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {isTransferConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/30 backdrop-blur-2xs px-4">
          <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-base font-semibold text-[#3A2E22] mb-2">
              Xác nhận chuyển bàn?
            </h3>
            <p className="text-xs text-[#7D6B55] mb-4">
              Chuyển từ Bàn #{transferSourceTable?.id} sang Bàn #
              {transferDestinationTable?.id}.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsTransferConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EED8B4] bg-white text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                className="px-4 py-2 rounded-xl bg-[#FFF0C2] text-[#855509] border border-[#EBCB7B] text-xs font-semibold"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {isTransferSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/30 backdrop-blur-2xs px-4">
          <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-base font-semibold text-[#9E6B0B] mb-2">
              Chuyển bàn thành công
            </h3>
            <button
              type="button"
              onClick={() => setIsTransferSuccessModalOpen(false)}
              className="mt-3 px-4 py-2 rounded-xl bg-[#FFF0C2] text-[#855509] border border-[#EBCB7B] text-xs font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Modal Thành công thao tác chung */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A2E22]/30 backdrop-blur-2xs px-4">
          <div className="bg-white border border-[#F2DFC2] rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <h3 className="text-base font-semibold text-[#9E6B0B] mb-2">
              Thao tác thành công
            </h3>
            <p className="text-xs text-[#7D6B55] mb-4">
              {actionSuccessText || "Dữ liệu bàn đã được cập nhật."}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSuccessModalOpen(false);
                setActionSuccessText("");
              }}
              className="px-4 py-2 rounded-xl bg-[#FFF0C2] text-[#855509] border border-[#EBCB7B] text-xs font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagementAdmin;
